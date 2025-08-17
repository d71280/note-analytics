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

// 最小限のレスポンスを返す
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[Simple Receive] Got content:', body.content?.length || 0, 'chars')
    
    // テキストで成功を返す（CORBを回避）
    return new Response('SUCCESS', {
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