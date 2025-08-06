import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, content_type, tags } = body

    if (!title || !content || !content_type) {
      return NextResponse.json(
        { error: 'Title, content, and content_type are required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from('knowledge_base')
      .insert({
        title,
        content,
        content_type,
        tags: tags || []
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create knowledge item:', error)
      return NextResponse.json(
        { error: 'Failed to create knowledge item' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, item: data })
  } catch (error) {
    console.error('Create knowledge error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}