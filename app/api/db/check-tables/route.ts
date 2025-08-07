import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // tweet_queueテーブルの情報を取得
    const { data: tweetQueue, error: tweetQueueError } = await supabase
      .from('tweet_queue')
      .select('*')
      .limit(5)
    
    // x_scheduled_postsテーブルの情報を取得（存在する場合）
    const { data: scheduledPosts, error: scheduledPostsError } = await supabase
      .from('x_scheduled_posts')
      .select('*')
      .limit(5)
    
    // テーブル構造を確認
    const result = {
      tweet_queue: {
        exists: !tweetQueueError,
        error: tweetQueueError?.message,
        sample_data: tweetQueue,
        count: tweetQueue?.length || 0
      },
      x_scheduled_posts: {
        exists: !scheduledPostsError,
        error: scheduledPostsError?.message,
        sample_data: scheduledPosts,
        count: scheduledPosts?.length || 0
      }
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Database check error:', error)
    return NextResponse.json(
      { error: 'Failed to check database tables' },
      { status: 500 }
    )
  }
}