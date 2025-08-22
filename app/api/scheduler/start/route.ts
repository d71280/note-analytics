import { NextResponse } from 'next/server'
import { startScheduler, stopScheduler, runSchedulerOnce } from '@/lib/scheduler/auto-runner'

// スケジューラーを開始
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const interval = parseInt(searchParams.get('interval') || '1')

  try {
    switch (action) {
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