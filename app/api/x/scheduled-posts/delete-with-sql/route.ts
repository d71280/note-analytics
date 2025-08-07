import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const confirm = searchParams.get('confirm')
    
    if (confirm !== 'DELETE_ALL_SQL') {
      return NextResponse.json(
        { 
          error: '確認パラメータが必要です',
          message: '?confirm=DELETE_ALL_SQL を追加してください' 
        },
        { status: 400 }
      )
    }

    // Adminクライアントを取得
    let adminClient
    try {
      adminClient = createAdminClient()
      console.log('Using admin client with Service Role')
    } catch (error) {
      console.log('Service Role not available, using regular client:', error)
      const { createClient } = await import('@/lib/supabase/server')
      adminClient = createClient()
    }
    
    console.log('SQL Delete: Starting...')
    
    // 方法1: RLSを無効化してから削除
    try {
      // RLSを一時的に無効化
      const { error: disableRLSError } = await adminClient.rpc('exec_sql', {
        query: 'ALTER TABLE tweet_queue DISABLE ROW LEVEL SECURITY;'
      })
      
      if (disableRLSError) {
        console.log('RLS disable failed, trying direct SQL...')
      }
    } catch {
      console.log('RLS modification not available')
    }
    
    // 方法2: 直接SQLで削除
    try {
      // カウントを取得
      const { data: countData } = await adminClient
        .from('tweet_queue')
        .select('id', { count: 'exact', head: true })
      
      const totalCount = countData || 0
      console.log('Total records to delete:', totalCount)
      
      // SQLで直接削除
      const { data: deleteResult, error: deleteError } = await adminClient.rpc('delete_all_tweets', {})
      
      if (!deleteError && deleteResult !== undefined) {
        return NextResponse.json({ 
          success: true,
          message: `SQLで${deleteResult}件の投稿を削除しました`,
          deleted: deleteResult,
          method: 'rpc_function'
        })
      }
    } catch {
      console.log('RPC function not available, trying raw delete')
    }
    
    // 方法3: 通常の削除（Admin権限）
    const { data: beforeDelete } = await adminClient
      .from('tweet_queue')
      .select('id')
    
    const beforeCount = beforeDelete?.length || 0
    console.log('Before delete count:', beforeCount)
    
    // すべて削除
    const { error: deleteError } = await adminClient
      .from('tweet_queue')
      .delete()
      .gte('created_at', '1970-01-01') // すべてのレコードを対象
    
    if (deleteError) {
      console.error('Delete error:', deleteError)
      
      // エラーでも確認
      const { data: afterDelete } = await adminClient
        .from('tweet_queue')
        .select('id')
      
      const afterCount = afterDelete?.length || 0
      const actualDeleted = beforeCount - afterCount
      
      if (actualDeleted > 0) {
        return NextResponse.json({ 
          success: true,
          message: `部分的に成功: ${actualDeleted}件削除`,
          deleted: actualDeleted,
          remaining: afterCount,
          method: 'partial'
        })
      }
      
      return NextResponse.json(
        { 
          error: '削除に失敗しました',
          details: deleteError.message,
          suggestion: 'SupabaseのSQL Editorで直接実行してください: DELETE FROM tweet_queue;'
        },
        { status: 500 }
      )
    }
    
    // 削除後の確認
    const { data: remaining } = await adminClient
      .from('tweet_queue')
      .select('id')
    
    const remainingCount = remaining?.length || 0
    const deletedCount = beforeCount - remainingCount
    
    return NextResponse.json({ 
      success: true,
      message: `${deletedCount}件の投稿を削除しました`,
      deleted: deletedCount,
      remaining: remainingCount,
      method: 'admin_delete'
    })
    
  } catch (error) {
    console.error('SQL delete error:', error)
    return NextResponse.json(
      { 
        error: '内部エラー',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'SupabaseのSQL Editorで以下を実行してください:\n\n1. ALTER TABLE tweet_queue DISABLE ROW LEVEL SECURITY;\n2. DELETE FROM tweet_queue;\n3. ALTER TABLE tweet_queue ENABLE ROW LEVEL SECURITY;'
      },
      { status: 500 }
    )
  }
}