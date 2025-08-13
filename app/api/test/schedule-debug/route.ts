import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// スケジュール投稿のデバッグ用エンドポイント
export async function GET() {
  try {
    const supabase = createClient()
    const now = new Date()

    // 1. 全てのスケジュール投稿を取得
    const { data: allPosts, error: allError } = await supabase
      .from('scheduled_posts')
      .select('*')
      .order('scheduled_for', { ascending: false })
      .limit(20)

    if (allError) {
      return NextResponse.json({
        error: 'Failed to fetch posts',
        details: allError.message
      }, { status: 500 })
    }

    // 2. pendingステータスの投稿を取得
    const { data: pendingPosts } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('status', 'pending')
      .order('scheduled_for', { ascending: true })

    // 3. 投稿時刻が過ぎているpending投稿を取得（cronが処理すべき投稿）
    const { data: readyPosts } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString())
      .order('scheduled_for', { ascending: true })

    // 4. ステータス別の集計
    const statusCounts = allPosts?.reduce((acc, post) => {
      acc[post.status] = (acc[post.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      currentTime: now.toISOString(),
      summary: {
        total: allPosts?.length || 0,
        statusCounts,
        pendingCount: pendingPosts?.length || 0,
        readyToPostCount: readyPosts?.length || 0
      },
      readyToPosts: readyPosts?.map(p => ({
        id: p.id,
        platform: p.platform,
        status: p.status,
        scheduled_for: p.scheduled_for,
        content: p.content.substring(0, 50) + '...'
      })),
      pendingPosts: pendingPosts?.map(p => ({
        id: p.id,
        platform: p.platform,
        status: p.status,
        scheduled_for: p.scheduled_for,
        isReady: p.scheduled_for ? new Date(p.scheduled_for) <= now : false,
        content: p.content.substring(0, 50) + '...'
      })),
      recentPosts: allPosts?.slice(0, 10).map(p => ({
        id: p.id,
        platform: p.platform,
        status: p.status,
        scheduled_for: p.scheduled_for,
        created_at: p.created_at,
        content: p.content.substring(0, 50) + '...'
      }))
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// 手動でcronジョブをトリガーするテスト用エンドポイント
export async function POST() {
  try {
    // cronジョブを手動実行
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/cron/auto-post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET || ''}`
      }
    })

    const result = await response.json()

    return NextResponse.json({
      message: 'Cron job triggered manually',
      cronResult: result,
      status: response.status
    })
  } catch (error) {
    console.error('Manual trigger error:', error)
    return NextResponse.json({
      error: 'Failed to trigger cron job',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}