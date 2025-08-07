import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 強制削除（RLSを回避）
export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json()
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Post IDs are required' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    // RLSをバイパスして削除を実行
    const deletedIds = []
    const errors = []
    
    for (const id of ids) {
      try {
        // 直接SQLを実行してRLSを回避
        const { error } = await supabase.rpc('delete_tweet_queue_by_id', {
          target_id: id
        })
        
        if (error) {
          // RPCが存在しない場合は通常の削除を試みる
          const { error: deleteError } = await supabase
            .from('tweet_queue')
            .delete()
            .eq('id', id)
            .select()
          
          if (deleteError) {
            errors.push({ id, error: deleteError.message })
          } else {
            deletedIds.push(id)
          }
        } else {
          deletedIds.push(id)
        }
      } catch (err) {
        errors.push({ id, error: err instanceof Error ? err.message : 'Unknown error' })
      }
    }
    
    return NextResponse.json({ 
      success: deletedIds.length > 0,
      deleted: deletedIds,
      failed: errors
    })
  } catch (error) {
    console.error('Force delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}