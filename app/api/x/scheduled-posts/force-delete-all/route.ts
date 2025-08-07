import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 管理者用：全投稿を強制削除（RLSバイパス）
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const confirm = searchParams.get('confirm')
    
    if (confirm !== 'DELETE_ALL') {
      return NextResponse.json(
        { 
          error: '確認パラメータが必要です',
          message: '?confirm=DELETE_ALL を追加してください' 
        },
        { status: 400 }
      )
    }

    // Service Roleクライアントを使用（RLSを完全バイパス）
    let adminClient
    try {
      adminClient = createAdminClient()
      console.log('Using admin client with Service Role')
    } catch (error) {
      console.log('Service Role not available, using regular client:', error)
      // Service Roleがない場合は通常クライアントを使用
      const { createClient } = await import('@/lib/supabase/server')
      adminClient = createClient()
    }
    
    console.log('Force delete all: Starting...')
    
    // まず全件取得
    const { data: allPosts, error: selectError } = await adminClient
      .from('tweet_queue')
      .select('*')
    
    console.log('Found posts:', allPosts?.length || 0)
    
    if (selectError) {
      console.error('Failed to fetch posts:', selectError)
      return NextResponse.json(
        { 
          error: 'データ取得エラー',
          details: selectError.message 
        },
        { status: 500 }
      )
    }
    
    if (!allPosts || allPosts.length === 0) {
      return NextResponse.json({ 
        success: true,
        message: '削除する投稿がありません',
        deleted: 0
      })
    }
    
    // 方法1: 全削除を試みる
    console.log('Attempting bulk delete...')
    const { error: bulkDeleteError, count } = await adminClient
      .from('tweet_queue')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // 存在しないIDを除外（全件対象）
    
    if (!bulkDeleteError) {
      console.log('Bulk delete successful:', count)
      return NextResponse.json({ 
        success: true,
        message: `${allPosts.length}件の投稿を削除しました`,
        deleted: allPosts.length,
        method: 'bulk'
      })
    }
    
    console.error('Bulk delete failed:', bulkDeleteError)
    
    // 方法2: 個別削除
    console.log('Attempting individual deletes...')
    let deletedCount = 0
    const errors = []
    
    for (const post of allPosts) {
      try {
        const { error } = await adminClient
          .from('tweet_queue')
          .delete()
          .eq('id', post.id)
        
        if (error) {
          console.error(`Failed to delete ${post.id}:`, error)
          errors.push({ 
            id: post.id, 
            error: error.message,
            content: post.content?.substring(0, 50) + '...'
          })
        } else {
          deletedCount++
          console.log(`Deleted ${post.id}`)
        }
      } catch (err) {
        console.error(`Exception deleting ${post.id}:`, err)
        errors.push({ 
          id: post.id, 
          error: err instanceof Error ? err.message : 'Unknown error' 
        })
      }
    }
    
    // 削除後の確認
    const { data: remaining } = await adminClient
      .from('tweet_queue')
      .select('id')
    
    return NextResponse.json({ 
      success: deletedCount > 0,
      message: `${deletedCount}/${allPosts.length}件を削除しました`,
      deleted: deletedCount,
      failed: errors,
      remaining: remaining?.length || 0,
      method: 'individual'
    })
    
  } catch (error) {
    console.error('Force delete all error:', error)
    return NextResponse.json(
      { 
        error: '内部エラー',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}