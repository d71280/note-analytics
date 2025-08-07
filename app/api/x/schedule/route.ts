import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { tweets, interval, platform = 'x' } = await request.json()
    
    if (!tweets || !Array.isArray(tweets) || tweets.length === 0) {
      return NextResponse.json(
        { error: 'No tweets provided' },
        { status: 400 }
      )
    }
    
    if (!interval || typeof interval !== 'number') {
      return NextResponse.json(
        { error: 'Invalid interval' },
        { status: 400 }
      )
    }
    
    const supabase = createClient()
    
    // スケジュールジョブを作成
    const scheduledTweets = tweets.map((content, index) => ({
      content,
      scheduled_at: new Date(Date.now() + (interval * 60 * 1000 * index)).toISOString(),
      status: 'pending',
      order_index: index,
      interval_minutes: interval,
      platform
    }))
    
    // Supabaseにスケジュールデータを保存
    const { data, error } = await supabase
      .from('tweet_queue')
      .insert(scheduledTweets)
      .select()
    
    if (error) {
      console.error('Failed to save scheduled tweets:', error)
      // テーブルが存在しない場合は作成
      if (error.code === '42P01') {
        // tweet_queueテーブルを作成
        const { error: createError } = await supabase.rpc('create_tweet_queue_table')
        if (createError) {
          console.error('Failed to create tweet_queue table:', createError)
          return NextResponse.json(
            { error: 'Database table not found. Please create tweet_queue table.' },
            { status: 500 }
          )
        }
        // 再度挿入を試みる
        const { data: retryData, error: retryError } = await supabase
          .from('tweet_queue')
          .insert(scheduledTweets)
          .select()
        
        if (retryError) {
          return NextResponse.json(
            { error: 'Failed to schedule tweets after table creation' },
            { status: 500 }
          )
        }
        
        return NextResponse.json({
          success: true,
          scheduled: retryData.length,
          firstPostAt: scheduledTweets[0].scheduled_at,
          lastPostAt: scheduledTweets[scheduledTweets.length - 1].scheduled_at
        })
      }
      
      return NextResponse.json(
        { error: 'Failed to schedule tweets' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      scheduled: data.length,
      firstPostAt: scheduledTweets[0].scheduled_at,
      lastPostAt: scheduledTweets[scheduledTweets.length - 1].scheduled_at
    })
  } catch (error) {
    console.error('Schedule error:', error)
    return NextResponse.json(
      { error: 'Failed to schedule tweets' },
      { status: 500 }
    )
  }
}

// スケジュールされたツイートの一覧を取得
export async function GET() {
  try {
    const { getScheduledPosts } = await import('@/lib/utils/scheduled-posts')
    const data = await getScheduledPosts()
    
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Get schedule error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get scheduled tweets',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}