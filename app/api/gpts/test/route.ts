import { NextResponse } from 'next/server'

// GPTs接続テスト用のシンプルなエンドポイント
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'GPTs API is working',
    timestamp: new Date().toISOString()
  })
}

export async function POST() {
  return NextResponse.json({
    status: 'ok',
    message: 'POST endpoint is working',
    timestamp: new Date().toISOString()
  })
}