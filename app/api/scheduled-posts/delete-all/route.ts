import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const confirm = searchParams.get('confirm')
    
    if (confirm !== 'true') {
      return NextResponse.json(
        { error: 'Confirmation required' },
        { status: 400 }
      )
    }
    
    const supabase = createAdminClient()
    
    // すべての投稿を削除
    const { data, error } = await supabase
      .from('scheduled_posts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // すべてを削除するためのワークアラウンド
      .select()
    
    if (error) {
      console.error('Failed to delete all scheduled posts:', error)
      return NextResponse.json(
        { error: 'Failed to delete all posts', details: error },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      deleted: data?.length || 0,
      message: 'すべての投稿を削除しました'
    })
    
  } catch (error) {
    console.error('Delete all scheduled posts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}