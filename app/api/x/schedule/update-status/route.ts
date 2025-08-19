import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PUT(request: NextRequest) {
  try {
    const { id, status, posted_at, error_message } = await request.json()
    
    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID and status are required' },
        { status: 400 }
      )
    }
    
    const supabase = createAdminClient()
    
    const updateData: Record<string, string> = {
      status,
      updated_at: new Date().toISOString()
    }
    
    if (posted_at) updateData.posted_at = posted_at
    if (error_message) updateData.error_message = error_message
    
    const { data, error } = await supabase
      .from('tweet_queue')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Failed to update post status:', error)
      return NextResponse.json(
        { error: 'Failed to update post status' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Update status error:', error)
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    )
  }
}