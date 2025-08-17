import { NextRequest, NextResponse } from 'next/server'

// CORS設定
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  })
}

// シンプルなテストエンドポイント
export async function POST(request: NextRequest) {
  console.log('=== GPTs Test Simple API ===')
  
  try {
    const body = await request.json()
    console.log('Received body:', body)
    
    // どんなリクエストでも成功を返す
    return NextResponse.json({
      success: true,
      message: 'Test successful!',
      received: body,
      timestamp: new Date().toISOString()
    }, {
      headers: getCorsHeaders()
    })
    
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to parse request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 400,
      headers: getCorsHeaders()
    })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'GPTs test endpoint is working',
    timestamp: new Date().toISOString()
  }, {
    headers: getCorsHeaders()
  })
}