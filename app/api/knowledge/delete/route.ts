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

    console.log('Deleting knowledge base item with ID:', id)
    
    const supabase = await createClient()
    
    // まず関連するchunksを削除（存在する場合）
    const { data: chunks, error: chunksError } = await supabase
      .from('knowledge_chunks')
      .delete()
      .eq('knowledge_id', id)  // 正しいカラム名に修正
      .select()
    
    if (chunksError && chunksError.code !== 'PGRST116') { // PGRST116は「行が見つかりません」エラー
      console.error('Failed to delete chunks:', chunksError)
      return NextResponse.json(
        { error: 'Failed to delete related chunks', details: chunksError.message },
        { status: 500 }
      )
    }
    
    console.log('Deleted chunks:', chunks?.length || 0)
    
    // 次にknowledge_baseレコードを削除
    const { data: deletedBase, error: baseError } = await supabase
      .from('knowledge_base')
      .delete()
      .eq('id', id)
      .select()
      .single()
    
    if (baseError) {
      console.error('Failed to delete knowledge base:', baseError)
      return NextResponse.json(
        { error: 'Failed to delete knowledge base item', details: baseError.message },
        { status: 500 }
      )
    }
    
    if (!deletedBase) {
      console.error('No record found with ID:', id)
      return NextResponse.json(
        { error: 'Knowledge base item not found' },
        { status: 404 }
      )
    }
    
    console.log('Successfully deleted knowledge base item:', deletedBase.title)

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