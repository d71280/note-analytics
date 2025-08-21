import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// CORS設定
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }
}

// OPTIONS メソッド - プリフライトリクエストに対応
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  })
}

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params
    const supabase = createAdminClient()
    
    // まずコンテンツが存在するか確認
    const { data: existingPost, error: fetchError } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('id', id)
      .single()
    
    if (fetchError || !existingPost) {
      console.error('Post not found:', { id, error: fetchError })
      return NextResponse.json(
        { error: 'Post not found', details: fetchError?.message },
        { status: 404, headers: getCorsHeaders() }
      )
    }
    
    console.log('Found post to publish:', existingPost)
    
    // 投稿を公開状態に更新
    const { data, error } = await supabase
      .from('scheduled_posts')
      .update({
        status: 'published',
        published_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Failed to publish content:', { id, error, details: error.message })
      return NextResponse.json(
        { error: 'Failed to publish content', details: error.message },
        { status: 500, headers: getCorsHeaders() }
      )
    }
    
    console.log('Successfully published:', data)
    
    // TODO: 実際のプラットフォームへの投稿処理を実装
    // 例: X (Twitter) API, Note API, WordPress APIへの投稿
    
    return NextResponse.json({
      success: true,
      data
    }, {
      headers: getCorsHeaders()
    })
  } catch (error) {
    console.error('Publish error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}

// GETメソッドも追加（デバッグ用）
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params
  return NextResponse.json({ 
    message: 'Publish endpoint is working', 
    id,
    methods: ['GET', 'POST', 'OPTIONS']
  }, {
    headers: getCorsHeaders()
  })
}