import { NextResponse } from 'next/server'
import { startScheduler, stopScheduler, runSchedulerOnce, getSchedulerStatus } from '@/lib/scheduler/auto-runner'

// スケジューラーを開始（開発環境のみ）
export async function GET(request: Request) {
  // 本番環境ではVercel Cron Jobsを使用するため、このエンドポイントは無効化
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ 
      message: 'This endpoint is disabled in production. Use Vercel Cron Jobs instead.',
      environment: 'production'
    })
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const interval = parseInt(searchParams.get('interval') || '1')

  try {
    switch (action) {
      case 'status':
        const status = getSchedulerStatus()
        return NextResponse.json({ 
          success: true, 
          isRunning: status.isRunning,
          isEnabled: status.isEnabled
        })
      
      case 'stop':
        stopScheduler()
        return NextResponse.json({ 
          success: true, 
          message: 'Scheduler stopped' 
        })
      
      case 'run':
        await runSchedulerOnce()
        return NextResponse.json({ 
          success: true, 
          message: 'Scheduler ran once' 
        })
      
      case 'start':
      default:
        startScheduler(interval)
        return NextResponse.json({ 
          success: true, 
          message: `Scheduler started with ${interval} minute interval` 
        })
    }
  } catch (error) {
    console.error('Scheduler control error:', error)
    return NextResponse.json(
      { error: 'Failed to control scheduler' },
      { status: 500 }
    )
  }
}