import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // GPTs APIエンドポイントへのアクセスを許可
  if (request.nextUrl.pathname.startsWith('/api/gpts/')) {
    // User-Agentをチェック
    const userAgent = request.headers.get('user-agent') || ''
    console.log('User-Agent:', userAgent)
    
    // ChatGPT/OpenAIからのアクセスを明示的に許可（改善版）
    const isFromChatGPT = /chatgpt|openai/i.test(userAgent) ||
                          request.headers.has('openai-conversation-id') ||
                          request.headers.has('chatgpt-conversation-id') ||
                          request.headers.has('openai-ephemeral-user-id') ||
                          request.headers.has('chatgpt-ephemeral-user-id')
    
    // OPTIONSリクエストに対する処理
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
        },
      })
    }
    
    const response = NextResponse.next()
    
    // CORS headers - 全て許可
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD')
    response.headers.set('Access-Control-Allow-Headers', '*')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Expose-Headers', '*')
    
    // ChatGPT/OpenAI specific
    response.headers.set('X-Robots-Tag', 'noindex')
    response.headers.set('X-Frame-Options', 'ALLOWALL')
    
    // セキュリティヘッダーを緩和（GPTs用）
    response.headers.delete('X-Content-Type-Options')
    response.headers.delete('X-XSS-Protection')
    
    // ログ出力（デバッグ用）
    console.log('GPTs API Request:', {
      method: request.method,
      path: request.nextUrl.pathname,
      isFromChatGPT,
      userAgent: userAgent.substring(0, 100),
    })
    
    return response
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/api/gpts/:path*'
}