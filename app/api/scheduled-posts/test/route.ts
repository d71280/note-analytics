import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// スケジュール投稿のテスト用エンドポイント
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      content, 
      platform = 'x', 
      delay = 1, // デフォルト1分後
      title = 'テスト投稿'
    } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    // 現在時刻から指定された分数後の時刻を計算
    const scheduledTime = new Date()
    scheduledTime.setMinutes(scheduledTime.getMinutes() + delay)

    // スケジュール投稿を作成
    const { data, error } = await supabase
      .from('scheduled_posts')
      .insert({
        content,
        platform,
        scheduled_for: scheduledTime.toISOString(),
        status: 'pending',
        metadata: {
          title,
          test: true,
          created_via: 'test_endpoint'
        }
      })
      .select()
      .single()

    if (error) {
      logger.error('Failed to create test scheduled post', error)
      return NextResponse.json(
        { error: 'Failed to create scheduled post', details: error.message },
        { status: 500 }
      )
    }

    logger.info('Test scheduled post created', {
      action: 'test_scheduled_post',
      metadata: {
        postId: data.id,
        platform,
        scheduledFor: scheduledTime.toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      message: `Test post scheduled for ${scheduledTime.toLocaleString('ja-JP')}`,
      data: {
        id: data.id,
        platform,
        scheduled_for: scheduledTime.toISOString(),
        content: content.substring(0, 100) + (content.length > 100 ? '...' : '')
      }
    })
    
  } catch (error) {
    logger.error('Test scheduled post endpoint error', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// 即座に投稿を実行するテストエンドポイント
export async function GET(request: NextRequest) {
  try {
    // 手動で自動投稿処理を実行
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/cron/auto-post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      }
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to trigger auto-post', details: result },
        { status: response.status }
      )
    }

    logger.info('Manual auto-post triggered', {
      action: 'manual_auto_post',
      metadata: result
    })

    return NextResponse.json({
      success: true,
      message: 'Auto-post process triggered manually',
      result
    })
    
  } catch (error) {
    logger.error('Manual auto-post trigger error', error)
    return NextResponse.json(
      { error: 'Failed to trigger auto-post', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}