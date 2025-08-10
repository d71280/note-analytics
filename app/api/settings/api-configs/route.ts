import { NextResponse } from 'next/server'

// API設定情報を返すエンドポイント
export async function GET() {
  try {
    // API設定情報（現時点では静的なデータを返す）
    const configs = {
      x: {
        configured: !!process.env.X_API_KEY,
        hasConsumerKey: !!process.env.X_API_KEY,
        hasConsumerSecret: !!process.env.X_API_SECRET,
        hasAccessToken: !!process.env.X_ACCESS_TOKEN,
        hasAccessTokenSecret: !!process.env.X_ACCESS_TOKEN_SECRET,
      },
      openai: {
        configured: !!process.env.OPENAI_API_KEY,
        hasApiKey: !!process.env.OPENAI_API_KEY,
      },
      gpts: {
        configured: true,
        apiKey: process.env.GPTS_API_KEY || 'test-api-key-12345',
        endpoints: {
          receive: '/api/gpts/receive-content',
          contents: '/api/gpts/contents',
          test: '/api/gpts/test',
        }
      }
    }

    return NextResponse.json(configs)
  } catch (error) {
    console.error('Failed to get API configs:', error)
    return NextResponse.json(
      { error: 'Failed to get API configurations' },
      { status: 500 }
    )
  }
}