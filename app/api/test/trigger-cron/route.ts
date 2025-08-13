import { NextResponse } from 'next/server'

// 手動でcronをトリガーするテスト用エンドポイント
export async function POST() {
  try {
    console.log('Manually triggering cron job...')
    
    // X-Manual-Testヘッダーを付けてcronを実行
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://note-analytics.vercel.app'}/api/cron/auto-post`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Manual-Test': 'true' // 手動テストフラグ
      }
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      console.error('Cron trigger failed:', result)
      return NextResponse.json({
        error: 'Failed to trigger cron',
        status: response.status,
        details: result
      }, { status: response.status })
    }
    
    console.log('Cron job triggered successfully:', result)
    
    return NextResponse.json({
      success: true,
      message: 'Cron job triggered manually',
      result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error triggering cron:', error)
    return NextResponse.json({
      error: 'Failed to trigger cron job',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// 現在の状態を確認
export async function GET() {
  try {
    const debugResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://note-analytics.vercel.app'}/api/test/schedule-debug`)
    const debugData = await debugResponse.json()
    
    return NextResponse.json({
      message: 'Use POST to trigger cron job',
      currentStatus: debugData.summary,
      readyPosts: debugData.readyToPostCount,
      instruction: 'POST to this endpoint to manually trigger the cron job'
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}