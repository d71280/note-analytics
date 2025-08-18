import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // GPTs APIエンドポイントへのアクセスを完全許可
  if (request.nextUrl.pathname.startsWith('/api/gpts/')) {
    const userAgent = request.headers.get('user-agent') || ''
    const origin = request.headers.get('origin') || ''
    
    // ChatGPT判定（ログ用のみ、制御には使わない）
    const isFromChatGPT = /chatgpt|openai/i.test(userAgent) ||
                          request.headers.has('openai-conversation-id') ||
                          request.headers.has('chatgpt-conversation-id') ||
                          request.headers.has('openai-ephemeral-user-id') ||
                          request.headers.has('chatgpt-ephemeral-user-id') ||
                          origin.includes('openai.com')
    
    console.log('🔍 Middleware Debug:', {
      method: request.method,
      path: request.nextUrl.pathname,
      isFromChatGPT,
      userAgent: userAgent.substring(0, 100),
      origin,
      headers: Object.fromEntries(request.headers.entries())
    })
    
    // OPTIONSリクエスト（プリフライト）を最優先で処理
    if (request.method === 'OPTIONS') {
      console.log('✅ OPTIONS request - returning 200')
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': '*',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
      })
    }
    
    // 通常のリクエスト処理
    const response = NextResponse.next()
    
    // CORS headers - 完全開放
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', '*')
    response.headers.set('Access-Control-Allow-Headers', '*')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Expose-Headers', '*')
    response.headers.set('Access-Control-Max-Age', '86400')
    
    // セキュリティヘッダーを全削除（GPTs接続のため）
    response.headers.delete('X-Content-Type-Options')
    response.headers.delete('X-XSS-Protection')
    response.headers.delete('X-Frame-Options')
    response.headers.delete('Content-Security-Policy')
    
    return response
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/api/gpts/:path*'
}