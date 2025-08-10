import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

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

// デバッグ用エンドポイント - リクエスト情報を返す
export async function GET(request: Request) {
  const headersList = await headers()
  const requestHeaders: Record<string, string> = {}
  
  headersList.forEach((value, key) => {
    requestHeaders[key] = value
  })

  const response = {
    message: 'Debug endpoint - GET request received',
    timestamp: new Date().toISOString(),
    headers: requestHeaders,
    url: request.url,
    method: request.method,
    testMessage: 'If you see this, the connection is working!',
    nextStep: 'Use POST /api/gpts/receive-content to send content'
  }

  return NextResponse.json(response, {
    status: 200,
    headers: getCorsHeaders()
  })
}

export async function POST(request: Request) {
  const headersList = await headers()
  const requestHeaders: Record<string, string> = {}
  
  headersList.forEach((value, key) => {
    requestHeaders[key] = value
  })

  let body = null
  try {
    body = await request.json()
  } catch (error) {
    body = { error: 'Could not parse request body' }
  }

  const response = {
    message: 'Debug endpoint - POST request received',
    timestamp: new Date().toISOString(),
    headers: requestHeaders,
    body: body,
    url: request.url,
    method: request.method,
    apiKeyReceived: !!requestHeaders['x-api-key'] || !!requestHeaders['authorization'],
    suggestion: 'Your request is working! Now try /api/gpts/receive-content with content and platform fields.'
  }

  return NextResponse.json(response, {
    status: 200,
    headers: getCorsHeaders()
  })
}