import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// Vercel Cronジョブから定期的に呼び出される自動投稿処理
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const logEnd = logger.measurePerformance('auto-post-cron')
  
  try {
    // Vercel Cronからのアクセスをチェック
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    // Vercel cronからの呼び出しを判定
    const isVercelCron = request.headers.get('user-agent')?.includes('vercel-cron') || false
    
    // 開発環境または手動テストの場合
    const isDevelopment = process.env.NODE_ENV === 'development'
    const isManualTest = request.headers.get('x-manual-test') === 'true'
    
    // 認証をスキップする条件：
    // 1. Vercel cronからの呼び出し
    // 2. CRON_SECRETが設定されていない
    // 3. 開発環境
    // 4. 手動テスト
    const skipAuth = isVercelCron || !cronSecret || isDevelopment || isManualTest
    
    if (!skipAuth && authHeader !== `Bearer ${cronSecret}`) {
      logger.warning('Unauthorized cron access attempt', {
        action: 'cron_auth_failed',
        authHeader: authHeader ? 'present' : 'missing',
        isVercelCron,
        userAgent: request.headers.get('user-agent')
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.info('Auto-post cron job started', { action: 'cron_start' })
    
    const supabase = createClient()
    const now = new Date()
    const results = {
      processed: 0,
      posted: 0,
      failed: 0,
      errors: [] as string[]
    }

    // 1. スケジュール済みの投稿を取得（投稿時刻が過ぎているもの）
    const { data: scheduledPosts, error: fetchError } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(10) // 一度に処理する最大数

    if (fetchError) {
      logger.error('Failed to fetch scheduled posts', fetchError, {
        action: 'fetch_scheduled_posts'
      })
      return NextResponse.json({
        error: 'Failed to fetch scheduled posts',
        details: fetchError.message
      }, { status: 500 })
    }

    if (!scheduledPosts || scheduledPosts.length === 0) {
      logger.debug('No scheduled posts to process')
      logEnd()
      return NextResponse.json({
        message: 'No scheduled posts to process',
        timestamp: now.toISOString()
      })
    }

    logger.info(`Found ${scheduledPosts.length} posts to process`)

    // 2. 各投稿を処理
    for (const post of scheduledPosts) {
      results.processed++
      
      let retryCount = 0
      const maxRetries = 3
      let lastError: Error | null = null
      
      // リトライループ
      while (retryCount < maxRetries) {
        try {
          // プラットフォーム別の投稿処理
          let postResult = null
          
          switch (post.platform) {
            case 'x':
              postResult = await postToX(post.content, post.metadata)
              break
            case 'note':
              postResult = await postToNote(post.content, post.metadata)
              break
            case 'wordpress':
              postResult = await postToWordPress(post.content, post.metadata)
              break
            default:
              throw new Error(`Unknown platform: ${post.platform}`)
          }

          if (postResult.success) {
            // 投稿成功 - ステータスを更新
            await supabase
              .from('scheduled_posts')
              .update({
                status: 'posted',
                metadata: {
                  ...post.metadata,
                  posted_at: now.toISOString(),
                  post_id: 'postId' in postResult ? postResult.postId : undefined,
                  retry_count: retryCount
                }
              })
              .eq('id', post.id)

            results.posted++
            
            logger.info(`Successfully posted to ${post.platform}`, {
              action: 'post_success',
              metadata: { 
                postId: post.id, 
                platform: post.platform,
                retryCount 
              }
            })

            // 分析データを記録
            await recordAnalytics(post.id, post.platform)
            
            break // 成功したらループを抜ける
            
          } else {
            throw new Error(postResult.error || 'Unknown error')
          }
          
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown error')
          retryCount++
          
          logger.warning(`Retry ${retryCount}/${maxRetries} for post ${post.id}`, {
            action: 'post_retry',
            metadata: { 
              postId: post.id, 
              platform: post.platform,
              error: lastError.message
            }
          })
          
          if (retryCount < maxRetries) {
            // 指数バックオフで待機
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
          }
        }
      }
      
      // すべてのリトライが失敗した場合
      if (retryCount >= maxRetries && lastError) {
        results.failed++
        const errorMessage = lastError.message
        results.errors.push(`Post ${post.id}: ${errorMessage} (after ${maxRetries} retries)`)
        
        await supabase
          .from('scheduled_posts')
          .update({
            status: 'failed',
            metadata: {
              ...post.metadata,
              failed_at: now.toISOString(),
              error: errorMessage,
              retry_count: retryCount
            }
          })
          .eq('id', post.id)

        logger.error(`Failed to post to ${post.platform} after ${maxRetries} retries`, lastError, {
          action: 'post_failed',
          metadata: { postId: post.id, platform: post.platform }
        })
      }

      // レート制限対策 - 投稿間に遅延を入れる
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    // 3. 処理結果をログに記録
    const executionTime = Date.now() - startTime
    logger.info('Auto-post cron job completed', {
      action: 'cron_complete',
      metadata: {
        processed: results.processed,
        posted: results.posted,
        failed: results.failed,
        executionTime
      }
    })

    logEnd()

    return NextResponse.json({
      success: true,
      results,
      executionTime,
      timestamp: now.toISOString()
    })

  } catch (error) {
    logger.critical('Auto-post cron job failed', error, {
      action: 'cron_critical_error'
    })
    
    logEnd()
    
    return NextResponse.json({
      error: 'Cron job failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// X（Twitter）への投稿
async function postToX(content: string, metadata?: Record<string, unknown>) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/x/post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: content,
        postType: 'scheduled',
        metadata
      })
    })

    if (response.ok) {
      const data = await response.json()
      return { success: true, postId: data.tweetId }
    } else {
      const error = await response.json()
      return { success: false, error: error.error || 'Failed to post to X' }
    }
  } catch (error) {
    logger.error('Failed to post to X', error)
    return { success: false, error: 'Network error' }
  }
}

// Noteへの投稿
async function postToNote(content: string, metadata?: Record<string, unknown>) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/note/post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        title: (metadata?.title as string) || 'スケジュール投稿',
        metadata
      })
    })

    if (response.ok) {
      const data = await response.json()
      return { success: true, postId: data.id }
    } else {
      const error = await response.json()
      return { success: false, error: error.error || 'Failed to post to Note' }
    }
  } catch (error) {
    logger.error('Failed to post to Note', error)
    return { success: false, error: 'Network error' }
  }
}

// WordPressへの投稿
async function postToWordPress(content: string, metadata?: Record<string, unknown>) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/wordpress/post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        title: (metadata?.title as string) || 'スケジュール投稿',
        metadata
      })
    })

    if (response.ok) {
      const data = await response.json()
      return { success: true, postId: data.id }
    } else {
      const error = await response.json()
      return { success: false, error: error.error || 'Failed to post to WordPress' }
    }
  } catch (error) {
    logger.error('Failed to post to WordPress', error)
    return { success: false, error: 'Network error' }
  }
}

// 分析データの記録
async function recordAnalytics(postId: string, platform: string) {
  try {
    const supabase = createClient()
    await supabase
      .from('analytics')
      .insert({
        post_id: postId,
        platform,
        impressions: 0,
        engagements: 0,
        tracked_at: new Date().toISOString()
      })
  } catch (error) {
    logger.error('Failed to record analytics', error)
  }
}

// 手動実行用のPOSTエンドポイント
export async function POST(request: NextRequest) {
  // 手動実行の場合も同じ処理を呼び出す
  return GET(request)
}