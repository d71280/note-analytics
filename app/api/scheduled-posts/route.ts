import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .order('scheduled_for', { ascending: false, nullsFirst: false })
    
    if (error) {
      console.error('Failed to fetch scheduled posts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch scheduled posts' },
        { status: 500 }
      )
    }
    
    // すべての投稿を表示（手動作成もGPTs由来も含む）
    const filteredData = data || []
    
    return NextResponse.json(filteredData)
  } catch (error) {
    console.error('Error fetching scheduled posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, platform, scheduled_for, metadata } = body
    
    if (!content || !platform) {
      return NextResponse.json(
        { error: 'Content and platform are required' },
        { status: 400 }
      )
    }
    
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('scheduled_posts')
      .insert({
        content,
        platform,
        scheduled_for: scheduled_for || null,
        status: scheduled_for ? 'pending' : 'draft',
        metadata: {
          ...metadata,
          source: 'manual' // 手動作成の投稿であることを明示
        }
      })
      .select()
      .single()
    
    if (error) {
      console.error('Failed to create scheduled post:', error)
      return NextResponse.json(
        { error: 'Failed to create scheduled post' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating scheduled post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, scheduled_for, content, metadata, status, display_order } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // データの検証
    if (status && !['draft', 'pending', 'scheduled', 'posted', 'failed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      )
    }

    if (content !== undefined && typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content must be a string' },
        { status: 400 }
      )
    }

    if (scheduled_for !== undefined && scheduled_for !== null) {
      const scheduledDate = new Date(scheduled_for)
      if (isNaN(scheduledDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid scheduled_for date format' },
          { status: 400 }
        )
      }
    }

    if (display_order !== undefined && (typeof display_order !== 'number' || display_order < 0)) {
      return NextResponse.json(
        { error: 'Display order must be a non-negative number' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // 更新するデータを構築
    const updateData: Record<string, unknown> = {}
    if (scheduled_for !== undefined) updateData.scheduled_for = scheduled_for
    if (content !== undefined) updateData.content = content
    if (metadata !== undefined) updateData.metadata = metadata
    if (status !== undefined) updateData.status = status
    if (display_order !== undefined) updateData.display_order = display_order

    // スケジュール投稿を更新
    const { data, error } = await supabase
      .from('scheduled_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update scheduled post:', error)
      
      // 制約違反エラーの詳細を提供
      if (error.code === '23514') {
        return NextResponse.json(
          { 
            error: 'Constraint violation', 
            details: 'Invalid value for platform or status field',
            constraint: error.message 
          },
          { status: 400 }
        )
      }
      
      if (error.code === '23505') {
        return NextResponse.json(
          { 
            error: 'Duplicate key violation', 
            details: error.message 
          },
          { status: 400 }
        )
      }
      
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