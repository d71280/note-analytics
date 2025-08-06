import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getXApiConfig } from '@/lib/x-api/config'

export async function POST(request: NextRequest) {
  try {
    // 認証チェック（必要に応じて実装）
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const supabase = createClient()
    
    // 現在時刻より前のスケジュールされたツイートを取得
    const now = new Date().toISOString()
    const { data: pendingTweets, error: fetchError } = await supabase
      .from('tweet_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(1)
    
    if (fetchError) {
      console.error('Failed to fetch pending tweets:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch pending tweets' },
        { status: 500 }
      )
    }
    
    if (!pendingTweets || pendingTweets.length === 0) {
      return NextResponse.json({ message: 'No pending tweets' })
    }
    
    const tweet = pendingTweets[0]
    
    // ツイートを投稿
    try {
      // X APIの設定を取得
      try {
        getXApiConfig()
      } catch {
        throw new Error('X API credentials not configured. Please set environment variables.')
      }
      
      // X APIでツイートを投稿
      const response = await fetch('/api/x/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: tweet.content
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to post tweet')
      }
      
      // ステータスを更新
      await supabase
        .from('tweet_queue')
        .update({ 
          status: 'posted',
          posted_at: new Date().toISOString()
        })
        .eq('id', tweet.id)
      
      return NextResponse.json({
        success: true,
        message: 'Tweet posted successfully',
        tweetId: tweet.id
      })
      
    } catch (postError) {
      console.error('Failed to post tweet:', postError)
      
      // エラーステータスに更新
      await supabase
        .from('tweet_queue')
        .update({ 
          status: 'failed',
          error_message: postError instanceof Error ? postError.message : 'Unknown error'
        })
        .eq('id', tweet.id)
      
      return NextResponse.json(
        { error: 'Failed to post tweet' },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('Process queue error:', error)
    return NextResponse.json(
      { error: 'Failed to process tweet queue' },
      { status: 500 }
    )
  }
}

// キューの状態を取得
export async function GET() {
  try {
    const supabase = createClient()
    
    const { data: stats, error } = await supabase
      .from('tweet_queue')
      .select('status')
    
    if (error) {
      throw error
    }
    
    const pending = stats?.filter(t => t.status === 'pending').length || 0
    const posted = stats?.filter(t => t.status === 'posted').length || 0
    const failed = stats?.filter(t => t.status === 'failed').length || 0
    
    return NextResponse.json({
      pending,
      posted,
      failed,
      total: stats?.length || 0
    })
    
  } catch {
    console.error('Get queue stats error:', error)
    return NextResponse.json(
      { error: 'Failed to get queue stats' },
      { status: 500 }
    )
  }
}