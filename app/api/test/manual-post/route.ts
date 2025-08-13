import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// テスト用の手動投稿作成エンドポイント
export async function POST() {
  try {
    const supabase = createClient()
    const now = new Date()
    
    // 5分後に投稿予定のテストデータを作成
    const scheduledTime = new Date(now.getTime() + 5 * 60 * 1000)
    
    const testPosts = [
      {
        content: 'テスト投稿（X）: ' + now.toLocaleString('ja-JP'),
        platform: 'x' as const,
        scheduled_for: scheduledTime.toISOString(),
        status: 'pending' as const,
        metadata: {
          source: 'test',
          createdAt: now.toISOString()
        }
      },
      {
        content: 'テスト投稿（Note）: ' + now.toLocaleString('ja-JP'),
        platform: 'note' as const,
        scheduled_for: new Date(scheduledTime.getTime() + 60000).toISOString(),
        status: 'pending' as const,
        metadata: {
          source: 'test',
          title: 'テストタイトル',
          createdAt: now.toISOString()
        }
      }
    ]
    
    const { data, error } = await supabase
      .from('scheduled_posts')
      .insert(testPosts)
      .select()
    
    if (error) {
      console.error('Failed to create test posts:', error)
      return NextResponse.json({
        error: 'Failed to create test posts',
        details: error.message
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test posts created successfully',
      posts: data,
      scheduledFor: {
        x: scheduledTime.toISOString(),
        note: new Date(scheduledTime.getTime() + 60000).toISOString()
      }
    })
  } catch (error) {
    console.error('Error creating test posts:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// 既存のテスト投稿を確認
export async function GET() {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) {
      return NextResponse.json({
        error: 'Failed to fetch posts',
        details: error.message
      }, { status: 500 })
    }
    
    return NextResponse.json({
      posts: data,
      count: data?.length || 0
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}