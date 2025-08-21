import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// CORS設定のヘルパー関数
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '86400',
  }
}

// コンテンツ詳細を取得
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params
    const supabase = createAdminClient()
    
    // scheduled_postsテーブルから取得
    const { data, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !data) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404, headers: getCorsHeaders() }
      )
    }
    
    return NextResponse.json(data, {
      headers: getCorsHeaders()
    })
  } catch (error) {
    console.error('Failed to fetch content:', error)
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}

// コンテンツを削除
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params
    console.log('Deleting GPTs content:', id)
    
    const supabase = createAdminClient()
    
    const { error } = await supabase
      .from('scheduled_posts')
      .delete()
      .eq('id', id)
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete content' },
        { status: 500, headers: getCorsHeaders() }
      )
    }
    
    return NextResponse.json(
      { success: true, message: 'Content deleted successfully' },
      { headers: getCorsHeaders() }
    )
  } catch (error) {
    console.error('Failed to delete content:', error)
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}

// コンテンツを更新
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params
    const body = await request.json()
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('scheduled_posts')
      .update({
        content: body.content,
        platform: body.platform,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error || !data) {
      return NextResponse.json(
        { error: 'Failed to update content' },
        { status: 500, headers: getCorsHeaders() }
      )
    }
    
    return NextResponse.json(data, {
      headers: getCorsHeaders()
    })
  } catch (error) {
    console.error('Failed to update content:', error)
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}

// OPTIONS メソッド - プリフライトリクエストに対応
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  })
}