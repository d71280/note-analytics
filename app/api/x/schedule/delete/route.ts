import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }
    
    const supabase = createAdminClient()
    
    const { error } = await supabase
      .from('tweet_queue')
      .delete()
      .eq('id', id)
      .eq('status', 'pending') // 投稿待ちのものだけ削除可能
    
    if (error) {
      console.error('Failed to delete scheduled post:', error)
      return NextResponse.json(
        { error: 'Failed to delete scheduled post' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete schedule error:', error)
    return NextResponse.json(
      { error: 'Failed to delete scheduled post' },
      { status: 500 }
    )
  }
}