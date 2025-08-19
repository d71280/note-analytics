import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// スケジュール投稿システムの状態を確認するエンドポイント
export async function GET() {
  try {
    const supabase = createAdminClient()
    const now = new Date()
    
    // 各ステータスの投稿数を取得
    const { data: statusCounts, error: countError } = await supabase
      .from('scheduled_posts')
      .select('status')
      .then(result => {
        if (result.error) return { data: null, error: result.error }
        
        const counts: Record<string, number> = {
          pending: 0,
          posted: 0,
          failed: 0,
          draft: 0,
          scheduled: 0
        }
        
        result.data?.forEach(post => {
          if (post.status in counts) {
            counts[post.status]++
          }
        })
        
        return { data: counts, error: null }
      })

    if (countError) {
      logger.error('Failed to get status counts', countError)
    }

    // 今後24時間の予定投稿を取得
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const { data: upcomingPosts, error: upcomingError } = await supabase
      .from('scheduled_posts')
      .select('id, platform, scheduled_for, content')
      .eq('status', 'pending')
      .gte('scheduled_for', now.toISOString())
      .lte('scheduled_for', tomorrow.toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(10)

    if (upcomingError) {
      logger.error('Failed to get upcoming posts', upcomingError)
    }

    // 直近の失敗した投稿を取得
    const { data: failedPosts, error: failedError } = await supabase
      .from('scheduled_posts')
      .select('id, platform, scheduled_for, metadata')
      .eq('status', 'failed')
      .order('scheduled_for', { ascending: false })
      .limit(5)

    if (failedError) {
      logger.error('Failed to get failed posts', failedError)
    }

    // 遅延している投稿（予定時刻を過ぎているがまだpending）を取得
    const { data: delayedPosts, error: delayedError } = await supabase
      .from('scheduled_posts')
      .select('id, platform, scheduled_for, content')
      .eq('status', 'pending')
      .lt('scheduled_for', now.toISOString())
      .order('scheduled_for', { ascending: true })

    if (delayedError) {
      logger.error('Failed to get delayed posts', delayedError)
    }

    // システムの健全性を判定
    const health = {
      status: 'healthy',
      issues: [] as string[]
    }

    if (delayedPosts && delayedPosts.length > 0) {
      health.status = 'warning'
      health.issues.push(`${delayedPosts.length}件の投稿が遅延しています`)
    }

    if (statusCounts && statusCounts.failed > 10) {
      health.status = 'critical'
      health.issues.push(`失敗した投稿が${statusCounts.failed}件あります`)
    }

    // Cronジョブの最終実行時刻を推定（5分間隔で実行されるはず）
    const lastCronRun = new Date(Math.floor(now.getTime() / (5 * 60 * 1000)) * (5 * 60 * 1000))
    const nextCronRun = new Date(lastCronRun.getTime() + 5 * 60 * 1000)

    logger.info('Schedule status checked', {
      action: 'status_check',
      metadata: {
        statusCounts,
        delayedCount: delayedPosts?.length || 0,
        upcomingCount: upcomingPosts?.length || 0
      }
    })

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      health,
      statistics: {
        statusCounts: statusCounts || {},
        delayedPosts: {
          count: delayedPosts?.length || 0,
          posts: delayedPosts?.map(p => ({
            id: p.id,
            platform: p.platform,
            scheduled_for: p.scheduled_for,
            delay_minutes: Math.floor((now.getTime() - new Date(p.scheduled_for).getTime()) / 60000)
          })) || []
        },
        upcomingPosts: {
          count: upcomingPosts?.length || 0,
          posts: upcomingPosts?.map(p => ({
            id: p.id,
            platform: p.platform,
            scheduled_for: p.scheduled_for,
            content_preview: p.content.substring(0, 50) + '...'
          })) || []
        },
        failedPosts: {
          count: failedPosts?.length || 0,
          posts: failedPosts?.map(p => ({
            id: p.id,
            platform: p.platform,
            scheduled_for: p.scheduled_for,
            error: p.metadata?.error || 'Unknown error'
          })) || []
        }
      },
      cron: {
        lastEstimatedRun: lastCronRun.toISOString(),
        nextScheduledRun: nextCronRun.toISOString(),
        intervalMinutes: 5
      }
    })
    
  } catch (error) {
    logger.error('Schedule status endpoint error', error)
    return NextResponse.json(
      { 
        error: 'Failed to get schedule status', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}