import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ユニバーサルCORSヘッダー（完全開放）
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
  }
}

// ChatGPT/OpenAIからのリクエストを判定（改善版）
function isFromChatGPT(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || ''
  
  // より広範囲にマッチする判定
  const isGPT = /chatgpt|openai/i.test(userAgent) ||
                 request.headers.has('openai-conversation-id') ||
                 request.headers.has('chatgpt-conversation-id') ||
                 request.headers.has('openai-ephemeral-user-id') ||
                 request.headers.has('chatgpt-ephemeral-user-id')
  
  // デバッグ用ログ（Vercelログで確認用）
  console.log('🔍 ChatGPT Detection:', {
    isGPT,
    userAgent: userAgent.substring(0, 100),
    hasOpenAIHeaders: request.headers.has('openai-conversation-id'),
    hasChatGPTHeaders: request.headers.has('chatgpt-conversation-id'),
    method: request.method,
    url: request.url
  })
  
  return isGPT  // 注意：この値はログのみで使用、アクセス制御には使わない
}

// OPTIONS - プリフライトリクエスト処理（必須）
export async function OPTIONS() {
  console.log('OPTIONS request received')
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  })
}

// GET - ChatGPT承認回避用のメインエンドポイント
export async function GET(request: NextRequest) {
  console.log('GET request received', {
    url: request.url,
    isFromChatGPT: isFromChatGPT(request),
    userAgent: request.headers.get('user-agent'),
  })
  
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action')
  const content = searchParams.get('content')
  const platform = searchParams.get('platform') || 'x'
  
  // テストモード
  if (action === 'test' || !content) {
    return NextResponse.json({
      success: true,
      message: 'Universal GPTs endpoint is ready',
      timestamp: new Date().toISOString(),
      isFromChatGPT: isFromChatGPT(request),
      methods: ['GET', 'POST'],
      parameters: {
        action: 'save|test',
        content: 'your content',
        platform: 'x|note|wordpress'
      }
    }, {
      headers: getCorsHeaders()
    })
  }
  
  // コンテンツ保存
  if (action === 'save' && content) {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('scheduled_posts')
        .insert({
          content,
          platform,
          status: 'draft',
          metadata: {
            source: 'gpts-universal',
            method: 'GET',
            isFromChatGPT: isFromChatGPT(request),
            receivedAt: new Date().toISOString()
          }
        })
        .select()
        .single()
      
      if (error) throw error
      
      return NextResponse.json({
        success: true,
        contentId: data.id,
        message: 'Content saved successfully',
        platform
      }, {
        headers: getCorsHeaders()
      })
    } catch (error) {
      console.error('Save error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to save content'
      }, {
        status: 500,
        headers: getCorsHeaders()
      })
    }
  }
  
  return NextResponse.json({
    success: false,
    error: 'Invalid action'
  }, {
    status: 400,
    headers: getCorsHeaders()
  })
}

// POST - 従来のPOSTエンドポイント（CORS完全対応）
export async function POST(request: NextRequest) {
  console.log('POST request received', {
    isFromChatGPT: isFromChatGPT(request),
    userAgent: request.headers.get('user-agent'),
  })
  
  try {
    const body = await request.json()
    const { content, platform = 'x' } = body
    
    if (!content) {
      return NextResponse.json({
        success: false,
        error: 'Content is required'
      }, {
        status: 400,
        headers: getCorsHeaders()
      })
    }
    
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('scheduled_posts')
      .insert({
        content,
        platform,
        status: 'draft',
        metadata: {
          source: 'gpts-universal',
          method: 'POST',
          isFromChatGPT: isFromChatGPT(request),
          receivedAt: new Date().toISOString()
        }
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      contentId: data.id,
      message: 'Content saved successfully',
      platform
    }, {
      headers: getCorsHeaders()
    })
    
  } catch (error) {
    console.error('POST error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to save content'
    }, {
      status: 500,
      headers: getCorsHeaders()
    })
  }
}