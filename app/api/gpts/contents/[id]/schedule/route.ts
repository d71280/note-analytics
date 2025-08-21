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

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params
    const body = await request.json()
    const { scheduled_for } = body
    
    console.log('Schedule API called:', { id, scheduled_for, body })
    
    if (!scheduled_for) {
      return NextResponse.json(
        { error: 'scheduled_for is required' },
        { status: 400, headers: getCorsHeaders() }
      )
    }
    
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
    
    console.log('Found post to schedule:', existingPost)
    
    const { data, error } = await supabase
      .from('scheduled_posts')
      .update({
        scheduled_for,
        status: 'pending' // cronジョブが検索するステータス
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Failed to schedule content:', { id, error, details: error.message })
      return NextResponse.json(
        { error: 'Failed to schedule content', details: error.message },
        { status: 500, headers: getCorsHeaders() }
      )
    }
    
    console.log('Successfully scheduled:', data)
    
    return NextResponse.json({
      success: true,
      data
    }, {
      headers: getCorsHeaders()
    })
  } catch (error) {
    console.error('Schedule error:', error)
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
    message: 'Schedule endpoint is working', 
    id,
    methods: ['GET', 'PUT', 'OPTIONS']
  }, {
    headers: getCorsHeaders()
  })
}