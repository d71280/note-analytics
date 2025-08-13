import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { scheduledFor } = body
    
    console.log('Schedule API called:', { id: params.id, scheduledFor, body })
    
    if (!scheduledFor) {
      return NextResponse.json(
        { error: 'scheduledFor is required' },
        { status: 400 }
      )
    }
    
    const supabase = createClient()
    
    // \u307e\u305a\u30b3\u30f3\u30c6\u30f3\u30c4\u304c\u5b58\u5728\u3059\u308b\u304b\u78ba\u8a8d
    const { data: existingPost, error: fetchError } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (fetchError || !existingPost) {
      console.error('Post not found:', { id: params.id, error: fetchError })
      return NextResponse.json(
        { error: 'Post not found', details: fetchError?.message },
        { status: 404 }
      )
    }
    
    console.log('Found post to schedule:', existingPost)
    
    const { data, error } = await supabase
      .from('scheduled_posts')
      .update({
        scheduled_for: scheduledFor,
        status: 'pending' // cronジョブが検索するステータス
      })
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) {
      console.error('Failed to schedule content:', { id: params.id, error, details: error.message })
      return NextResponse.json(
        { error: 'Failed to schedule content', details: error.message },
        { status: 500 }
      )
    }
    
    console.log('Successfully scheduled:', data)
    
    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Schedule error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}