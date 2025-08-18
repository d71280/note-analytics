import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { autoCleanupOldContents } from '@/lib/utils/auto-cleanup'

// CORS設定
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, openai-conversation-id, openai-ephemeral-user-id',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json',
  }
}

// OPTIONS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  })
}

// GETエンドポイント（承認回避用）
export async function GET(request: NextRequest) {
  console.log('=== Public X GPTs GET Test ===')
  
  const searchParams = request.nextUrl.searchParams
  const content = searchParams.get('content')
  
  if (!content) {
    return NextResponse.json(
      { error: 'Content parameter is required' },
      { status: 400, headers: getCorsHeaders() }
    )
  }
  
  // 簡単なテスト応答
  return NextResponse.json({
    success: true,
    received: content,
    message: 'GET endpoint working'
  }, {
    headers: getCorsHeaders()
  })
}

// 認証なしのX投稿受信エンドポイント（テスト用）
export async function POST(request: NextRequest) {
  console.log('=== Public X GPTs Receive (No Auth) ===')
  
  try {
    const body = await request.json()
    const { content } = body
    
    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400, headers: getCorsHeaders() }
      )
    }
    
    // 280文字チェック
    if (content.length > 280) {
      return NextResponse.json(
        { 
          error: 'Content too long',
          maxLength: 280,
          currentLength: content.length
        },
        { status: 400, headers: getCorsHeaders() }
      )
    }
    
    const supabase = createClient()
    
    // 自動削除
    const cleanupResult = await autoCleanupOldContents(supabase)
    if (cleanupResult.deleted > 0) {
      console.log(`Cleaned up ${cleanupResult.deleted} old contents`)
    }
    
    // 保存
    const { data, error } = await supabase
      .from('scheduled_posts')
      .insert({
        content,
        platform: 'x',
        status: 'draft',
        metadata: {
          source: 'gpts-public',
          contentLength: content.length,
          receivedAt: new Date().toISOString()
        }
      })
      .select()
      .single()
    
    if (error) {
      console.error('Save error:', error)
      return NextResponse.json(
        { error: 'Failed to save' },
        { status: 500, headers: getCorsHeaders() }
      )
    }
    
    return NextResponse.json({
      success: true,
      contentId: data.id,
      message: 'Content saved successfully'
    }, {
      headers: getCorsHeaders()
    })
    
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}