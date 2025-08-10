import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

// CORSヘッダーを設定する関数
function setCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400')
  return response
}

// API認証を確認する関数
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function validateApiKey(): Promise<boolean> {
  const headersList = await headers()
  const apiKey = headersList.get('x-api-key') || headersList.get('authorization')?.replace('Bearer ', '')
  
  // 環境変数からAPIキーを取得
  const validApiKey = process.env.GPTS_API_KEY || 'test-api-key-12345'
  
  // APIキーが一致するか確認
  return apiKey === validApiKey
}

// OPTIONSリクエスト（プリフライト）の処理
export async function OPTIONS() {
  const response = NextResponse.json({ message: 'OK' }, { status: 200 })
  return setCorsHeaders(response)
}

// GETリクエストの処理 - プラットフォーム設定を返す
export async function GET() {
  try {
    // API認証をチェック（オプション）
    // const isValidApiKey = await validateApiKey()
    
    // 認証が必要な場合はここでチェック
    // if (!isValidApiKey) {
    //   const response = NextResponse.json(
    //     { error: 'Invalid API key' },
    //     { status: 401 }
    //   )
    //   return setCorsHeaders(response)
    // }
    
    // プラットフォーム設定を返す
    const settings = {
      platform: 'note-analytics-platform',
      version: '1.0.0',
      features: {
        contentReceiving: true,
        analytics: true,
        scheduling: true,
        multiPlatform: ['note', 'twitter', 'instagram']
      },
      endpoints: {
        receiveContent: '/api/gpts/receive-content',
        getContents: '/api/gpts/contents',
        testConnection: '/api/gpts/test',
        generateApiKey: '/api/gpts/generate-key',
        verifyApiKey: '/api/gpts/api-key'
      },
      authentication: {
        type: 'api-key',
        header: 'x-api-key',
        required: false // 一時的にfalseに設定
      },
      status: 'active',
      timestamp: new Date().toISOString()
    }
    
    const response = NextResponse.json(settings, { status: 200 })
    return setCorsHeaders(response)
  } catch (error) {
    console.error('Settings endpoint error:', error)
    const response = NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
    return setCorsHeaders(response)
  }
}

// POSTリクエストの処理 - 設定を更新
export async function POST(request: Request) {
  try {
    // API認証をチェック
    // const isValidApiKey = await validateApiKey()
    
    // 認証が必要な場合はここでチェック
    // if (!isValidApiKey) {
    //   const response = NextResponse.json(
    //     { error: 'Invalid API key' },
    //     { status: 401 }
    //   )
    //   return setCorsHeaders(response)
    // }
    
    const body = await request.json()
    
    // ここで設定を処理（データベースに保存など）
    console.log('Received settings update:', body)
    
    const response = NextResponse.json({
      status: 'success',
      message: 'Settings updated successfully',
      data: body,
      timestamp: new Date().toISOString()
    }, { status: 200 })
    
    return setCorsHeaders(response)
  } catch (error) {
    console.error('Settings update error:', error)
    const response = NextResponse.json(
      { 
        error: 'Failed to update settings',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
    return setCorsHeaders(response)
  }
}