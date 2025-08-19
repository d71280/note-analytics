import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// スケジュール投稿を作成するエンドポイント
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, platform = 'x', scheduledMinutes = 5 } = body
    
    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }
    
    const supabase = createAdminClient()
    
    // スケジュール時刻を計算（現在時刻 + 指定分数）
    const scheduledFor = new Date()
    scheduledFor.setMinutes(scheduledFor.getMinutes() + scheduledMinutes)
    
    // スケジュール投稿を作成
    const { data, error } = await supabase
      .from('scheduled_posts')
      .insert({
        content,
        platform,
        status: 'pending', // Cronジョブが探すステータス
        scheduled_for: scheduledFor.toISOString(),
        metadata: {
          source: 'manual_schedule',
          scheduledMinutes,
          createdAt: new Date().toISOString()
        }
      })
      .select()
      .single()
    
    if (error) {
      console.error('Failed to create scheduled post:', error)
      return NextResponse.json(
        { error: 'Failed to create scheduled post' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      post: data,
      scheduledFor: scheduledFor.toISOString(),
      message: `Post scheduled for ${scheduledMinutes} minutes from now`
    })
    
  } catch (error) {
    console.error('Schedule create error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}