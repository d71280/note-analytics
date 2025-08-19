import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PUT(request: NextRequest) {
  try {
    const { id, content } = await request.json()
    
    if (!id || !content) {
      return NextResponse.json(
        { error: 'ID and content are required' },
        { status: 400 }
      )
    }
    
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('tweet_queue')
      .update({ 
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('status', 'pending') // 投稿待ちのものだけ編集可能
      .select()
      .single()
    
    if (error) {
      console.error('Failed to update scheduled post:', error)
      return NextResponse.json(
        { error: 'Failed to update scheduled post' },
        { status: 500 }
      )
    }
    
    if (!data) {
      return NextResponse.json(
        { error: 'Post not found or already posted' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Update schedule error:', error)
    return NextResponse.json(
      { error: 'Failed to update scheduled post' },
      { status: 500 }
    )
  }
}