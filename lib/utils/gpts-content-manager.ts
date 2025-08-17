/**
 * GPTsコンテンツの管理ユーティリティ
 */

// GPTsコンテンツの上限設定
export const GPTS_CONTENT_LIMITS = {
  MAX_CONTENTS: 500,        // 最大保存件数
  DELETE_THRESHOLD: 490,    // この件数を超えたら削除を開始
  DELETE_BATCH_SIZE: 50,    // 一度に削除する件数
  FETCH_LIMIT: 100,         // 削除チェック時の取得件数
} as const

/**
 * GPTs由来のコンテンツかどうかをチェック
 */
export function isGPTsContent(metadata: Record<string, unknown> | null | undefined): boolean {
  const source = metadata?.source
  if (!source) return false
  
  return source === 'gpts' || 
         source === 'gpts-note' || 
         source === 'gpts-x' || 
         source === 'gpts-wordpress' ||
         (typeof source === 'string' && source.includes('gpts'))
}

/**
 * 古いGPTsコンテンツの削除が必要かチェック
 */
export async function shouldDeleteOldContents(
  currentCount: number
): Promise<boolean> {
  return currentCount >= GPTS_CONTENT_LIMITS.DELETE_THRESHOLD
}

/**
 * 削除するコンテンツ数を計算
 */
export function calculateDeleteCount(currentCount: number): number {
  if (currentCount < GPTS_CONTENT_LIMITS.DELETE_THRESHOLD) {
    return 0
  }
  // 上限を超えた分 + バッファ分を削除
  const excess = currentCount - GPTS_CONTENT_LIMITS.DELETE_THRESHOLD
  return Math.min(
    excess + GPTS_CONTENT_LIMITS.DELETE_BATCH_SIZE,
    GPTS_CONTENT_LIMITS.DELETE_BATCH_SIZE * 2
  )
}

/**
 * コンテンツ管理の統計情報
 */
export interface ContentStats {
  total: number
  gptsCount: number
  availableSlots: number
  shouldCleanup: boolean
  recommendedDeleteCount: number
}

/**
 * コンテンツ統計を計算
 */
export function calculateContentStats(
  contents: Array<{ metadata?: Record<string, unknown> }>,
  gptsContents?: Array<{ metadata?: Record<string, unknown> }>
): ContentStats {
  const gptsCount = gptsContents?.length || 
    contents.filter(c => isGPTsContent(c.metadata)).length
  
  return {
    total: contents.length,
    gptsCount,
    availableSlots: Math.max(0, GPTS_CONTENT_LIMITS.MAX_CONTENTS - gptsCount),
    shouldCleanup: gptsCount >= GPTS_CONTENT_LIMITS.DELETE_THRESHOLD,
    recommendedDeleteCount: calculateDeleteCount(gptsCount)
  }
}