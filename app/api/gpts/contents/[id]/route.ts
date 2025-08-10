import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // scheduled_postsテーブルから取得
    const { data, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('id', params.id)
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
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('scheduled_posts')
      .delete()
      .eq('id', params.id)
    
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

// OPTIONS メソッド - プリフライトリクエストに対応
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  })
}