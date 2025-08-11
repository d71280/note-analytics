import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }
    
    const supabase = createClient()
    
    // 投稿を削除
    const { error } = await supabase
      .from('scheduled_posts')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Failed to delete scheduled post:', error)
      return NextResponse.json(
        { error: 'Failed to delete post', details: error },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: '投稿を削除しました'
    })
    
  } catch (error) {
    console.error('Delete scheduled post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 複数削除用のPOSTエンドポイント
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, status } = body
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'IDs are required' },
        { status: 400 }
      )
    }
    
    const supabase = createClient()
    
    // 条件に応じて削除
    let query = supabase.from('scheduled_posts').delete()
    
    if (status) {
      // 特定のステータスの投稿を削除
      query = query.eq('status', status).in('id', ids)
    } else {
      // 指定されたIDの投稿を削除
      query = query.in('id', ids)
    }
    
    const { error } = await query
    
    if (error) {
      console.error('Failed to delete scheduled posts:', error)
      return NextResponse.json(
        { error: 'Failed to delete posts', details: error },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: `${ids.length}件の投稿を削除しました`
    })
    
  } catch (error) {
    console.error('Delete scheduled posts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}