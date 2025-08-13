import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, scheduled_for, content, metadata, status } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // 更新するデータを構築
    const updateData: Record<string, unknown> = {}
    if (scheduled_for !== undefined) updateData.scheduled_for = scheduled_for
    if (content !== undefined) updateData.content = content
    if (metadata !== undefined) updateData.metadata = metadata
    if (status !== undefined) updateData.status = status

    // スケジュール投稿を更新
    const { data, error } = await supabase
      .from('scheduled_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update scheduled post:', error)
      return NextResponse.json(
        { error: 'Failed to update scheduled post', details: error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'スケジュール投稿を更新しました',
      data
    })

  } catch (error) {
    console.error('Update scheduled post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}