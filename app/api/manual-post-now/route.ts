import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 手動で今すぐ投稿を実行
export async function POST() {
  try {
    const supabase = createAdminClient()
    const now = new Date()
    
    // pendingステータスの投稿を取得
    const { data: pendingPosts, error: fetchError } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(5) // 一度に処理する最大数
    
    if (fetchError) {
      return NextResponse.json({
        error: 'Failed to fetch pending posts',
        details: fetchError.message
      }, { status: 500 })
    }
    
    if (!pendingPosts || pendingPosts.length === 0) {
      return NextResponse.json({
        message: 'No posts ready to be published',
        checked: now.toISOString()
      })
    }
    
    const results = []
    
    // 各投稿を処理
    for (const post of pendingPosts) {
      try {
        // X APIに投稿
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://note-analytics.vercel.app'}/api/x/post`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: post.content,
            postType: 'scheduled'
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          
          // ステータスを更新
          await supabase
            .from('scheduled_posts')
            .update({
              status: 'posted',
              metadata: {
                ...post.metadata,
                posted_at: now.toISOString(),
                tweet_id: data.tweetId
              }
            })
            .eq('id', post.id)
          
          results.push({
            id: post.id,
            status: 'success',
            tweetId: data.tweetId,
            url: data.url
          })
        } else {
          const error = await response.json()
          
          await supabase
            .from('scheduled_posts')
            .update({
              status: 'failed',
              metadata: {
                ...post.metadata,
                failed_at: now.toISOString(),
                error: error.error || 'Unknown error'
              }
            })
            .eq('id', post.id)
          
          results.push({
            id: post.id,
            status: 'failed',
            error: error.error
          })
        }
      } catch (error) {
        results.push({
          id: post.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
      
      // レート制限対策
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    return NextResponse.json({
      success: true,
      processed: results.length,
      results
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}