import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// スケジュール投稿のテスト作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { platform, content, title, scheduledMinutesFromNow = 1 } = body

    const supabase = createAdminClient()

    // スケジュール時刻を計算（デフォルトは1分後）
    const scheduledFor = new Date()
    scheduledFor.setMinutes(scheduledFor.getMinutes() + scheduledMinutesFromNow)

    // スケジュール投稿を作成
    const { data, error } = await supabase
      .from('scheduled_posts')
      .insert({
        platform: platform || 'x',
        content: content || `テスト投稿 - ${new Date().toLocaleString('ja-JP')}`,
        status: 'pending',
        scheduled_for: scheduledFor.toISOString(),
        metadata: title ? { title } : {}
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create scheduled post:', error)
      return NextResponse.json({
        error: 'スケジュール投稿の作成に失敗しました',
        details: error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${scheduledMinutesFromNow}分後に${platform}への投稿をスケジュールしました`,
      data,
      scheduledFor: scheduledFor.toISOString()
    })

  } catch (error) {
    console.error('Schedule test error:', error)
    return NextResponse.json({
      error: 'スケジュール投稿のテストに失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// スケジュール投稿の手動実行
export async function GET(request: NextRequest) {
  try {
    // CRON_SECRETを使用した認証をスキップ（テスト用）
    const forceExecute = request.nextUrl.searchParams.get('force') === 'true'
    
    if (!forceExecute) {
      return NextResponse.json({
        message: 'スケジュール投稿の手動実行テスト',
        instruction: 'URLに ?force=true を追加して実行してください'
      })
    }

    // process-posts APIを直接呼び出し
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:3000`
    const response = await fetch(`${baseUrl}/api/cron/process-posts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET || 'test'}`
      }
    })

    const result = await response.json()

    return NextResponse.json({
      success: response.ok,
      message: 'スケジュール投稿を手動実行しました',
      result
    })

  } catch (error) {
    console.error('Manual execution error:', error)
    return NextResponse.json({
      error: '手動実行に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}