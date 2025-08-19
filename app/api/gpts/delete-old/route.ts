import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// CORS設定
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  })
}

// 最も古いGPTsコンテンツを削除して新しいコンテンツ用のスペースを作る
export async function POST(request: NextRequest) {
  console.log('=== Delete Old GPTs Contents ===')
  
  try {
    const body = await request.json()
    const { deleteCount = 10 } = body // デフォルトで10件削除
    
    const supabase = createAdminClient()
    
    // GPTs由来の最も古いコンテンツを取得
    const { data: oldContents, error: fetchError } = await supabase
      .from('scheduled_posts')
      .select('id, created_at, metadata')
      .order('created_at', { ascending: true }) // 古い順
      .limit(deleteCount * 2) // 余分に取得してフィルタリング
    
    if (fetchError) {
      console.error('Fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch old contents', details: fetchError.message },
        { status: 500, headers: getCorsHeaders() }
      )
    }
    
    // GPTs由来のコンテンツのみフィルタリング（source にgptsが含まれるもの）
    const gptsContents = (oldContents || []).filter(content => {
      const source = content.metadata?.source
      return source && (
        source === 'gpts' || 
        source === 'gpts-note' || 
        source === 'gpts-x' || 
        source === 'gpts-wordpress' ||
        source.includes('gpts')
      )
    }).slice(0, deleteCount)
    
    if (gptsContents.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No old GPTs contents to delete',
        deleted: 0
      }, {
        headers: getCorsHeaders()
      })
    }
    
    // 削除対象のIDリスト
    const idsToDelete = gptsContents.map(c => c.id)
    console.log(`Deleting ${idsToDelete.length} old GPTs contents`)
    
    // 削除実行
    const { error: deleteError } = await supabase
      .from('scheduled_posts')
      .delete()
      .in('id', idsToDelete)
    
    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete contents', details: deleteError.message },
        { status: 500, headers: getCorsHeaders() }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${idsToDelete.length} old GPTs contents`,
      deleted: idsToDelete.length,
      deletedIds: idsToDelete
    }, {
      headers: getCorsHeaders()
    })
    
  } catch (error) {
    console.error('Delete old contents error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete old contents',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}