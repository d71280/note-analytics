import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 5分ごとにVercel Cronから呼び出される
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  try {
    console.log('[Scheduler Check] 開始')
    
    const supabase = createAdminClient()
    const now = new Date()
    
    // 現在時刻を過ぎている投稿を即座に処理（setTimeoutは使わない）
    const { data: scheduledPosts, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(10) // 一度に処理する最大数
    
    if (error) {
      console.error('[Scheduler Check] エラー:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    if (!scheduledPosts || scheduledPosts.length === 0) {
      console.log('[Scheduler Check] 投稿対象なし')
      return NextResponse.json({ 
        message: 'No posts to process',
        checked_at: now.toISOString()
      })
    }
    
    console.log(`[Scheduler Check] ${scheduledPosts.length}件の投稿を処理`)
    
    const results = {
      processed: 0,
      posted: 0,
      failed: 0
    }
    
    // 各投稿を即座に処理（setTimeoutは使わない）
    for (const post of scheduledPosts) {
      results.processed++
      
      try {
        console.log(`[Scheduler Check] ${post.id} の投稿を実行`)
        
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
            console.error(`[Scheduler Check] 不明なプラットフォーム: ${post.platform}`)
            continue
        }
        
        // 投稿APIを呼び出し
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })
        
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
                post_id: data.tweetId || data.id || data.postId
              }
            })
            .eq('id', post.id)
          
          results.posted++
          console.log(`✅ [Scheduler Check] ${post.id} 投稿成功`)
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
                error: error.error || 'Unknown error'
              }
            })
            .eq('id', post.id)
          
          results.failed++
          console.error(`❌ [Scheduler Check] ${post.id} 投稿失敗:`, error)
        }
        
        // レート制限対策のため少し待機
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.error(`[Scheduler Check] ${post.id} エラー:`, error)
        results.failed++
        
        // エラー時もステータス更新
        await supabase
          .from('scheduled_posts')
          .update({
            status: 'failed',
            metadata: {
              ...post.metadata,
              failed_at: new Date().toISOString(),
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          })
          .eq('id', post.id)
      }
    }
    
    return NextResponse.json({
      message: `Processed ${results.processed} posts`,
      results: {
        processed: results.processed,
        posted: results.posted,
        failed: results.failed
      },
      checked_at: now.toISOString()
    })
    
  } catch (error) {
    console.error('[Scheduler Check] クリティカルエラー:', error)
    return NextResponse.json({
      error: 'Scheduler check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}