import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // GPTs APIエンドポイントへのアクセスを許可
  if (request.nextUrl.pathname.startsWith('/api/gpts/')) {
    // OPTIONSリクエストに対する処理
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, openai-conversation-id, openai-ephemeral-user-id, openai-subdivision-1-iso-code',
          'Access-Control-Max-Age': '86400',
        },
      })
    }
    
    const response = NextResponse.next()
    
    // CORS headers for GPTs
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, openai-conversation-id, openai-ephemeral-user-id, openai-subdivision-1-iso-code')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    
    // ChatGPT/OpenAI specific headers
    response.headers.set('X-Robots-Tag', 'noindex')
    
    // ログ出力（デバッグ用）
    console.log('GPTs API Request:', {
      method: request.method,
      path: request.nextUrl.pathname,
      headers: Object.fromEntries(request.headers.entries()),
    })
    
    return response
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/api/gpts/:path*'
}