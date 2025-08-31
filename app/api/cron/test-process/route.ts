import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 手動テスト用のCRONエンドポイント
export async function GET(request: NextRequest) {
  try {
    console.log('[Test Process] 開始')
    
    const supabase = createAdminClient()
    const now = new Date()
    
    // 現在時刻を過ぎている投稿を取得
    const { data: scheduledPosts, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString())
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('scheduled_for', { ascending: true })
      .limit(5)
    
    if (error) {
      console.error('[Test Process] エラー:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    if (!scheduledPosts || scheduledPosts.length === 0) {
      console.log('[Test Process] 投稿対象なし')
      return NextResponse.json({ 
        message: 'No posts to process',
        checked_at: now.toISOString()
      })
    }
    
    console.log(`[Test Process] ${scheduledPosts.length}件の投稿を処理`)
    
    const results = {
      processed: 0,
      posted: 0,
      failed: 0,
      posts: [] as any[]
    }
    
    // 各投稿を処理
    for (const post of scheduledPosts) {
      results.processed++
      
      try {
        console.log(`[Test Process] ${post.id} の投稿を実行 (${post.platform})`)
        
        // 本番環境のURLを構築
        const baseUrl = process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}`
          : 'https://note-analytics.vercel.app'
        
        // プラットフォームに応じたAPIエンドポイントを選択
        let apiEndpoint = ''
        let requestBody = {}
        
        switch (post.platform) {
          case 'x':
            apiEndpoint = `${baseUrl}/api/x/post`
            requestBody = {
              text: post.content,
              postType: 'scheduled',
              metadata: post.metadata
            }
            break
          case 'note':
            apiEndpoint = `${baseUrl}/api/note/post`
            requestBody = {
              content: post.content,
              title: post.metadata?.title || 'スケジュール投稿',
              metadata: post.metadata
            }
            break
          case 'wordpress':
            apiEndpoint = `${baseUrl}/api/wordpress/post`
            requestBody = {
              content: post.content,
              title: post.metadata?.title || 'スケジュール投稿',
              metadata: post.metadata
            }
            break
          default:
            console.error(`[Test Process] 不明なプラットフォーム: ${post.platform}`)
            continue
        }
        
        console.log(`[Test Process] API呼び出し: ${apiEndpoint}`)
        
        // 投稿APIを呼び出し
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })
        
        console.log(`[Test Process] レスポンス: ${response.status}`)
        
        if (response.ok) {
          const data = await response.json()
          
          // 成功したらステータス更新
          await supabase
            .from('scheduled_posts')
            .update({
              status: 'posted',
              metadata: {
                ...post.metadata,
                posted_at: new Date().toISOString(),
                post_id: data.tweetId || data.id || data.postId,
                test_run: true
              }
            })
            .eq('id', post.id)
          
          results.posted++
          results.posts.push({
            id: post.id,
            platform: post.platform,
            status: 'posted',
            response: data
          })
          console.log(`✅ [Test Process] ${post.id} 投稿成功`)
        } else {
          const error = await response.json()
          
          // 失敗したらステータス更新
          await supabase
            .from('scheduled_posts')
            .update({
              status: 'failed',
              metadata: {
                ...post.metadata,
                failed_at: new Date().toISOString(),
                error: error.error || 'Unknown error',
                test_run: true
              }
            })
            .eq('id', post.id)
          
          results.failed++
          results.posts.push({
            id: post.id,
            platform: post.platform,
            status: 'failed',
            error: error
          })
          console.error(`❌ [Test Process] ${post.id} 投稿失敗:`, error)
        }
        
        // レート制限対策のため少し待機
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.error(`[Test Process] ${post.id} エラー:`, error)
        results.failed++
        
        // エラー時もステータス更新
        await supabase
          .from('scheduled_posts')
          .update({
            status: 'failed',
            metadata: {
              ...post.metadata,
              failed_at: new Date().toISOString(),
              error: error instanceof Error ? error.message : 'Unknown error',
              test_run: true
            }
          })
          .eq('id', post.id)
        
        results.posts.push({
          id: post.id,
          platform: post.platform,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    return NextResponse.json({
      message: `Processed ${results.processed} posts`,
      results: {
        processed: results.processed,
        posted: results.posted,
        failed: results.failed,
        posts: results.posts
      },
      checked_at: now.toISOString()
    })
    
  } catch (error) {
    console.error('[Test Process] クリティカルエラー:', error)
    return NextResponse.json({
      error: 'Test process failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}