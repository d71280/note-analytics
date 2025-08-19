import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 即座に投稿すべきテストデータを作成
export async function POST() {
  try {
    const supabase = createAdminClient()
    const now = new Date()
    
    // 過去の時刻で投稿予定のテストデータを作成（即座に処理されるべき）
    const pastTime = new Date(now.getTime() - 10 * 60 * 1000) // 10分前
    
    const testPost = {
      content: '即座投稿テスト: ' + now.toLocaleString('ja-JP'),
      platform: 'x' as const,
      scheduled_for: pastTime.toISOString(),
      status: 'pending' as const,
      metadata: {
        source: 'immediate-test',
        createdAt: now.toISOString()
      }
    }
    
    const { data, error } = await supabase
      .from('scheduled_posts')
      .insert(testPost)
      .select()
      .single()
    
    if (error) {
      console.error('Failed to create immediate test post:', error)
      return NextResponse.json({
        error: 'Failed to create test post',
        details: error.message
      }, { status: 500 })
    }
    
    // cronジョブを手動で実行
    try {
      const cronResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/cron/auto-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CRON_SECRET || ''}`
        }
      })
      
      const cronResult = await cronResponse.json()
      
      return NextResponse.json({
        success: true,
        message: 'Immediate test post created and cron triggered',
        post: data,
        cronResult,
        note: 'Check if the post was processed by the cron job'
      })
    } catch (cronError) {
      return NextResponse.json({
        success: true,
        message: 'Test post created but cron trigger failed',
        post: data,
        cronError: cronError instanceof Error ? cronError.message : 'Unknown error',
        note: 'Post was created but automatic processing may have failed'
      })
    }
  } catch (error) {
    console.error('Error creating immediate test post:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}