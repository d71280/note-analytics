import { NextResponse } from 'next/server'

// CORS設定のヘルパー関数
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    'Access-Control-Max-Age': '86400',
  }
}

// OPTIONS メソッド - プリフライトリクエストに対応
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  })
}

// GPTs接続テスト用のシンプルなエンドポイント
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'GPTs API is working',
    timestamp: new Date().toISOString()
  }, {
    headers: getCorsHeaders()
  })
}

export async function POST() {
  return NextResponse.json({
    status: 'ok',
    message: 'POST endpoint is working',
    timestamp: new Date().toISOString()
  }, {
    headers: getCorsHeaders()
  })
}