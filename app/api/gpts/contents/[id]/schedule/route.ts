import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { scheduledFor } = await request.json()
    
    if (!scheduledFor) {
      return NextResponse.json(
        { error: 'scheduledFor is required' },
        { status: 400 }
      )
    }
    
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('scheduled_posts')
      .update({
        scheduled_for: scheduledFor,
        status: 'pending'
      })
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) {
      console.error('Failed to schedule content:', error)
      return NextResponse.json(
        { error: 'Failed to schedule content' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Schedule error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}