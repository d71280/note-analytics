import { NextRequest } from 'next/server'

// 超シンプルなCORS設定
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'text/plain',
}

export async function OPTIONS() {
  return new Response('OK', { headers })
}

// X(Twitter)用の最小限のレスポンスを返す
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const content = body.content || ''
    
    // 280文字チェック
    if (content.length > 280) {
      return new Response('TOO_LONG', {
        status: 400,
        headers
      })
    }
    
    console.log('[Simple X Receive] Got content:', content.length, 'chars')
    
    // テキストで成功を返す（CORBを回避）
    return new Response('OK', {
      status: 200,
      headers
    })
  } catch {
    return new Response('ERROR', {
      status: 400,
      headers
    })
  }
}