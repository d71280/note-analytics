import { NextResponse } from 'next/server'

// CORS設定
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    'Access-Control-Max-Age': '86400',
  }
}

// OPTIONS メソッド
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  })
}

// テスト用の最小限のPOSTエンドポイント
export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Received from GPTs:', body)
    
    // どんなデータでも受け入れる
    const response = {
      success: true,
      message: 'データを受信しました！',
      receivedData: {
        content: body.content || 'コンテンツなし',
        platform: body.platform || 'note',
        timestamp: new Date().toISOString()
      }
    }
    
    return NextResponse.json(response, {
      status: 200,
      headers: getCorsHeaders()
    })
  } catch (error) {
    console.error('Error receiving data:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'データ受信エラー',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 200, // エラーでも200を返してGPTsを通す
        headers: getCorsHeaders()
      }
    )
  }
}

// GET メソッド - 動作確認用
export async function GET() {
  return NextResponse.json(
    {
      message: 'Test Send endpoint is working',
      usage: 'POST your content to this endpoint',
      example: {
        content: 'Your content here',
        platform: 'note'
      }
    },
    {
      status: 200,
      headers: getCorsHeaders()
    }
  )
}