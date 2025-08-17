import { SupabaseClient } from '@supabase/supabase-js'
import { GPTS_CONTENT_LIMITS, isGPTsContent } from './gpts-content-manager'

/**
 * 古いGPTsコンテンツを自動削除
 * 490件を超えたら古いものから50件削除
 */
export async function autoCleanupOldContents(
  supabase: SupabaseClient
): Promise<{ deleted: number; error?: string }> {
  try {
    // 現在のGPTsコンテンツ数を確認
    const { data: allContents } = await supabase
      .from('scheduled_posts')
      .select('id, metadata')
      .order('created_at', { ascending: false })
      .limit(600) // 余裕を持って取得
    
    if (!allContents) {
      return { deleted: 0 }
    }
    
    // GPTs由来のコンテンツをフィルタリング
    const gptsContents = allContents.filter(c => isGPTsContent(c.metadata))
    const gptsCount = gptsContents.length
    
    console.log(`[AutoCleanup] Current GPTs contents count: ${gptsCount}`)
    
    // 490件未満なら削除不要
    if (gptsCount < GPTS_CONTENT_LIMITS.DELETE_THRESHOLD) {
      return { deleted: 0 }
    }
    
    console.log(`[AutoCleanup] Threshold exceeded (${GPTS_CONTENT_LIMITS.DELETE_THRESHOLD}), starting cleanup...`)
    
    // 古い順に取得して削除対象を特定
    const { data: oldContents } = await supabase
      .from('scheduled_posts')
      .select('id, created_at, metadata')
      .order('created_at', { ascending: true })
      .limit(GPTS_CONTENT_LIMITS.FETCH_LIMIT)
    
    if (!oldContents || oldContents.length === 0) {
      return { deleted: 0 }
    }
    
    // GPTs由来の古いコンテンツを削除対象として選定
    const gptsOldContents = oldContents
      .filter(c => isGPTsContent(c.metadata))
      .slice(0, GPTS_CONTENT_LIMITS.DELETE_BATCH_SIZE)
    
    if (gptsOldContents.length === 0) {
      return { deleted: 0 }
    }
    
    // 削除実行
    const idsToDelete = gptsOldContents.map(c => c.id)
    const { error: deleteError } = await supabase
      .from('scheduled_posts')
      .delete()
      .in('id', idsToDelete)
    
    if (deleteError) {
      console.error('[AutoCleanup] Delete error:', deleteError)
      return { deleted: 0, error: deleteError.message }
    }
    
    console.log(`[AutoCleanup] Successfully deleted ${idsToDelete.length} old GPTs contents`)
    return { deleted: idsToDelete.length }
    
  } catch (error) {
    console.error('[AutoCleanup] Unexpected error:', error)
    return { 
      deleted: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}