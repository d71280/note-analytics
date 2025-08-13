import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 10分ごとに呼び出して、投稿時刻を過ぎたものを確実に投稿
export async function GET() {
  try {
    const supabase = createClient()
    const now = new Date()
    
    console.log(`[Auto Check] Starting at ${now.toISOString()}`)
    
    // 1. pending状態で投稿時刻を過ぎているものを取得
    const { data: readyPosts, error: fetchError } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(3) // 一度に処理する最大数（レート制限対策）
    
    if (fetchError) {
      console.error('[Auto Check] Failed to fetch posts:', fetchError)
      return NextResponse.json({
        error: 'Failed to fetch posts',
        details: fetchError.message
      }, { status: 500 })
    }
    
    if (!readyPosts || readyPosts.length === 0) {
      console.log('[Auto Check] No posts ready to publish')
      return NextResponse.json({
        message: 'No posts ready',
        checked_at: now.toISOString(),
        next_check: new Date(now.getTime() + 10 * 60 * 1000).toISOString()
      })
    }
    
    console.log(`[Auto Check] Found ${readyPosts.length} posts to publish`)
    
    const results: {
      success: Array<{ id: string; platform: string; url?: string }>;
      failed: Array<{ id: string; platform: string; error: string; retries?: number }>;
      total: number;
    } = {
      success: [],
      failed: [],
      total: readyPosts.length
    }
    
    // 2. 各投稿を処理
    for (const post of readyPosts) {
      try {
        console.log(`[Auto Check] Processing post ${post.id} for platform ${post.platform}`)
        
        // まず処理中としてマーク（重複防止）
        await supabase
          .from('scheduled_posts')
          .update({
            status: 'processing',
            metadata: {
              ...post.metadata,
              processing_started: now.toISOString()
            }
          })
          .eq('id', post.id)
          .eq('status', 'pending') // 二重チェック
        
        // プラットフォーム別の投稿処理
        let postResult = null
        
        switch (post.platform) {
          case 'x':
            const xResponse = await fetch('https://note-analytics.vercel.app/api/x/post', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: post.content,
                postType: 'scheduled',
                metadata: post.metadata
              })
            })
            
            if (xResponse.ok) {
              const xData = await xResponse.json()
              postResult = {
                success: true,
                postId: xData.tweetId,
                url: xData.url
              }
            } else {
              const xError = await xResponse.json()
              postResult = {
                success: false,
                error: xError.error || 'Failed to post to X'
              }
            }
            break
            
          case 'note':
            // Note APIの実装がある場合はここに追加
            postResult = {
              success: false,
              error: 'Note API not implemented'
            }
            break
            
          case 'wordpress':
            // WordPress APIの実装がある場合はここに追加
            postResult = {
              success: false,
              error: 'WordPress API not implemented'
            }
            break
            
          default:
            postResult = {
              success: false,
              error: `Unknown platform: ${post.platform}`
            }
        }
        
        // 3. 結果に応じてステータスを更新
        if (postResult.success) {
          await supabase
            .from('scheduled_posts')
            .update({
              status: 'posted',
              metadata: {
                ...post.metadata,
                posted_at: now.toISOString(),
                post_id: postResult.postId,
                post_url: postResult.url
              }
            })
            .eq('id', post.id)
          
          results.success.push({
            id: post.id,
            platform: post.platform,
            url: postResult.url
          })
          
          console.log(`[Auto Check] Successfully posted ${post.id}`)
        } else {
          // 失敗した場合は、リトライ回数を記録
          const retryCount = (post.metadata?.retry_count || 0) + 1
          const maxRetries = 3
          
          await supabase
            .from('scheduled_posts')
            .update({
              status: retryCount >= maxRetries ? 'failed' : 'pending',
              metadata: {
                ...post.metadata,
                last_error: postResult.error,
                last_attempt: now.toISOString(),
                retry_count: retryCount
              }
            })
            .eq('id', post.id)
          
          results.failed.push({
            id: post.id,
            platform: post.platform,
            error: postResult.error,
            retries: retryCount
          })
          
          console.error(`[Auto Check] Failed to post ${post.id}:`, postResult.error)
        }
        
      } catch (error) {
        console.error(`[Auto Check] Error processing post ${post.id}:`, error)
        
        // エラーの場合もpendingに戻す（次回再試行）
        await supabase
          .from('scheduled_posts')
          .update({
            status: 'pending',
            metadata: {
              ...post.metadata,
              last_error: error instanceof Error ? error.message : 'Unknown error',
              last_attempt: now.toISOString()
            }
          })
          .eq('id', post.id)
        
        results.failed.push({
          id: post.id,
          platform: post.platform,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
      
      // レート制限対策（1秒待機）
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    console.log('[Auto Check] Completed:', results)
    
    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
      next_check: new Date(now.getTime() + 10 * 60 * 1000).toISOString()
    })
    
  } catch (error) {
    console.error('[Auto Check] Critical error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}