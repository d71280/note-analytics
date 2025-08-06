import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Vercel Cronからのリクエストか確認
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const supabase = createClient()
    
    // 現在時刻より前のスケジュールされた投稿を取得
    const now = new Date().toISOString()
    const { data: pendingPosts, error: fetchError } = await supabase
      .from('tweet_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
    
    if (fetchError) {
      console.error('Failed to fetch pending posts:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch pending posts' },
        { status: 500 }
      )
    }
    
    if (!pendingPosts || pendingPosts.length === 0) {
      return NextResponse.json({ message: 'No pending posts' })
    }
    
    const results = []
    
    // 各投稿を処理
    for (const post of pendingPosts) {
      try {
        // プラットフォームに応じて処理
        if (post.platform === 'x') {
          // X APIの設定を取得
          const { data: settings } = await supabase
            .from('x_api_configs')
            .select('*')
            .single()
          
          if (!settings) {
            throw new Error('X API settings not found')
          }
          
          // X APIで投稿
          const xApiUrl = 'https://api.twitter.com/2/tweets'
          const response = await fetch(xApiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${settings.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: post.content
            })
          })
          
          if (response.ok) {
            const data = await response.json()
            
            // ステータスを更新
            await supabase
              .from('tweet_queue')
              .update({ 
                status: 'posted',
                posted_at: new Date().toISOString(),
                external_id: data.data?.id
              })
              .eq('id', post.id)
            
            results.push({
              id: post.id,
              status: 'posted',
              platform: post.platform
            })
          } else {
            const errorData = await response.text()
            throw new Error(`X API error: ${errorData}`)
          }
        } else {
          // Note, WordPress用の処理は後で実装
          console.log(`Platform ${post.platform} not yet implemented`)
          continue
        }
        
      } catch (postError) {
        console.error(`Failed to post ${post.id}:`, postError)
        
        // エラーステータスに更新
        await supabase
          .from('tweet_queue')
          .update({ 
            status: 'failed',
            error_message: postError instanceof Error ? postError.message : 'Unknown error'
          })
          .eq('id', post.id)
        
        results.push({
          id: post.id,
          status: 'failed',
          error: postError instanceof Error ? postError.message : 'Unknown error'
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      processed: results.length,
      results
    })
    
  } catch (error) {
    console.error('Cron process error:', error)
    return NextResponse.json(
      { error: 'Failed to process posts' },
      { status: 500 }
    )
  }
}