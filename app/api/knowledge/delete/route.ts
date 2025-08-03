import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    // まず関連するchunksを削除
    const { error: chunksError } = await supabase
      .from('knowledge_chunks')
      .delete()
      .eq('knowledge_base_id', id)
    
    if (chunksError) {
      console.error('Failed to delete chunks:', chunksError)
      return NextResponse.json(
        { error: 'Failed to delete related chunks' },
        { status: 500 }
      )
    }
    
    // 次にknowledge_baseレコードを削除
    const { error: baseError } = await supabase
      .from('knowledge_base')
      .delete()
      .eq('id', id)
    
    if (baseError) {
      console.error('Failed to delete knowledge base:', baseError)
      return NextResponse.json(
        { error: 'Failed to delete knowledge base item' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Knowledge base item deleted successfully'
    })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}