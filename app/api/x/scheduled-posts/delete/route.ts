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
    
    // スケジュール投稿を削除
    const { error } = await supabase
      .from('tweet_queue')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Delete scheduled post error:', error)
      return NextResponse.json(
        { error: 'Failed to delete scheduled post' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete scheduled post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 複数削除用
export async function POST(request: NextRequest) {
  try {
    const { ids, status } = await request.json()
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Post IDs are required' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    // 条件に基づいて削除
    let query = supabase
      .from('tweet_queue')
      .delete()
      .in('id', ids)
    
    // ステータスでフィルタリング（オプション）
    if (status) {
      query = query.eq('status', status)
    }
    
    const { error } = await query
    
    if (error) {
      console.error('Delete scheduled posts error:', error)
      return NextResponse.json(
        { error: 'Failed to delete scheduled posts' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      deleted: ids.length 
    })
  } catch (error) {
    console.error('Delete scheduled posts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}