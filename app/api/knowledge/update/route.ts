import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, title, content, content_type, tags } = body

    if (!id || !title || !content || !content_type) {
      return NextResponse.json(
        { error: 'ID, title, content, and content_type are required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from('knowledge_base')
      .update({
        title,
        content,
        content_type,
        tags: tags || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update knowledge item:', error)
      return NextResponse.json(
        { error: 'Failed to update knowledge item' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, item: data })
  } catch (error) {
    console.error('Update knowledge error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}