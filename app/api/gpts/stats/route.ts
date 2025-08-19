import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateContentStats, isGPTsContent } from '@/lib/utils/gpts-content-manager'

// GPTsコンテンツの統計情報を取得
export async function GET() {
  try {
    const supabase = createAdminClient()
    
    // すべてのコンテンツを取得
    const { data: allContents, error } = await supabase
      .from('scheduled_posts')
      .select('id, created_at, platform, status, metadata')
      .order('created_at', { ascending: false })
      .limit(600) // 統計用に多めに取得
    
    if (error) {
      console.error('Failed to fetch contents:', error)
      return NextResponse.json(
        { error: 'Failed to fetch statistics' },
        { status: 500 }
      )
    }
    
    // GPTs由来のコンテンツのみフィルタリング
    const gptsContents = (allContents || []).filter(content => 
      isGPTsContent(content.metadata)
    )
    
    // 統計情報を計算
    const stats = calculateContentStats(allContents || [], gptsContents)
    
    // 詳細な統計情報
    const now = new Date()
    const detailedStats = {
      ...stats,
      byPlatform: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      byAge: {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        older: 0
      }
    }
    
    gptsContents.forEach(content => {
      // プラットフォーム別
      const platform = content.platform || 'unknown'
      detailedStats.byPlatform[platform] = (detailedStats.byPlatform[platform] || 0) + 1
      
      // ステータス別
      const status = content.status || 'unknown'
      detailedStats.byStatus[status] = (detailedStats.byStatus[status] || 0) + 1
      
      // 経過日数別
      const createdDate = new Date(content.created_at)
      const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff === 0) {
        detailedStats.byAge.today++
      } else if (daysDiff <= 7) {
        detailedStats.byAge.thisWeek++
      } else if (daysDiff <= 30) {
        detailedStats.byAge.thisMonth++
      } else {
        detailedStats.byAge.older++
      }
    })
    
    return NextResponse.json({
      statistics: detailedStats,
      limits: {
        max: 500,
        current: stats.gptsCount,
        available: stats.availableSlots,
        threshold: 490,
        deleteSize: 50
      },
      recommendation: stats.shouldCleanup ? 
        `古いコンテンツの削除を推奨します（${stats.recommendedDeleteCount}件）` : 
        `まだ余裕があります（残り${stats.availableSlots}件保存可能）`
    })
    
  } catch (error) {
    console.error('Statistics error:', error)
    return NextResponse.json(
      { error: 'Failed to get statistics' },
      { status: 500 }
    )
  }
}