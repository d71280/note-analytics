import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 5分ごとにVercel Cronから呼び出される
export async function GET(request: NextRequest) {
  try {
    console.log('[Scheduler Check] 開始')
    
    const supabase = createAdminClient()
    const now = new Date()
    
    // 現在時刻から5分以内にスケジュールされている投稿を取得
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)
    
    const { data: scheduledPosts, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('status', 'pending')
      .gte('scheduled_for', now.toISOString())
      .lte('scheduled_for', fiveMinutesFromNow.toISOString())
      .order('scheduled_for', { ascending: true })
    
    if (error) {
      console.error('[Scheduler Check] エラー:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    if (!scheduledPosts || scheduledPosts.length === 0) {
      console.log('[Scheduler Check] 対象なし')
      return NextResponse.json({ 
        message: 'No posts scheduled in next 5 minutes',
        checked_at: now.toISOString()
      })
    }
    
    console.log(`[Scheduler Check] ${scheduledPosts.length}件の投稿をスケジュール`)
    
    // 各投稿に対してタイマーを設定
    for (const post of scheduledPosts) {
      const scheduledTime = new Date(post.scheduled_for)
      const delay = scheduledTime.getTime() - now.getTime()
      
      if (delay > 0) {
        console.log(`[Scheduler Check] ${post.id} を ${Math.round(delay/1000)}秒後に投稿予約`)
        
        // 指定時刻に直接投稿APIを呼び出す
        setTimeout(async () => {
          try {
            console.log(`[Scheduler Check] ${post.id} の投稿を実行`)
            
            // 本番環境のURLを構築
            const baseUrl = process.env.VERCEL_URL 
              ? `https://${process.env.VERCEL_URL}`
              : 'https://note-analytics.vercel.app'
            
            // 直接投稿APIを呼び出し（これは成功実績あり）
            const response = await fetch(`${baseUrl}/api/x/post`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: post.content,
                postType: 'scheduled',
                metadata: post.metadata
              })
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
                    tweet_id: data.tweetId
                  }
                })
                .eq('id', post.id)
              
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
                    error: error.error
                  }
                })
                .eq('id', post.id)
              
              console.error(`❌ [Scheduler Check] ${post.id} 投稿失敗:`, error)
            }
          } catch (error) {
            console.error(`[Scheduler Check] ${post.id} エラー:`, error)
          }
        }, delay)
      }
    }
    
    return NextResponse.json({
      message: `Scheduled ${scheduledPosts.length} posts`,
      posts: scheduledPosts.map(p => ({
        id: p.id,
        scheduled_for: p.scheduled_for,
        delay_seconds: Math.round((new Date(p.scheduled_for).getTime() - now.getTime()) / 1000)
      })),
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