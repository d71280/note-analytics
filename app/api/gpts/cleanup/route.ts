import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// CORS設定のヘルパー関数
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  })
}

// 古いGPTsコンテンツを削除
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // URLパラメータから設定を取得
    const { searchParams } = new URL(request.url)
    const keepCount = parseInt(searchParams.get('keep') || '30')
    const olderThanDays = parseInt(searchParams.get('days') || '30')
    
    // 30日以上前の日付を計算
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)
    
    // まず古いGPTs由来のコンテンツを取得
    const { data: oldContents, error: fetchError } = await supabase
      .from('scheduled_posts')
      .select('id, created_at, metadata')
      .lt('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false })
    
    if (fetchError) {
      console.error('Failed to fetch old contents:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch old contents' },
        { status: 500, headers: getCorsHeaders() }
      )
    }
    
    // GPTs由来のコンテンツのみフィルタリング
    const gptsContents = oldContents?.filter(content => 
      content.metadata?.source?.includes('gpts')
    ) || []
    
    if (gptsContents.length === 0) {
      return NextResponse.json({
        message: 'No old GPTs contents to delete',
        deleted: 0
      }, {
        headers: getCorsHeaders()
      })
    }
    
    // 削除対象のIDリスト
    const idsToDelete = gptsContents.map(c => c.id)
    
    // 削除実行
    const { error: deleteError } = await supabase
      .from('scheduled_posts')
      .delete()
      .in('id', idsToDelete)
    
    if (deleteError) {
      console.error('Failed to delete old contents:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete old contents' },
        { status: 500, headers: getCorsHeaders() }
      )
    }
    
    return NextResponse.json({
      message: `Deleted ${idsToDelete.length} old GPTs contents`,
      deleted: idsToDelete.length,
      cutoffDate: cutoffDate.toISOString()
    }, {
      headers: getCorsHeaders()
    })
    
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup contents' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}

// 統計情報を取得
export async function GET() {
  try {
    const supabase = createClient()
    
    // 全コンテンツを取得して統計を計算
    const { data: allContents, error } = await supabase
      .from('scheduled_posts')
      .select('id, created_at, platform, status, metadata')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Failed to fetch contents:', error)
      return NextResponse.json(
        { error: 'Failed to fetch statistics' },
        { status: 500, headers: getCorsHeaders() }
      )
    }
    
    // GPTs由来のコンテンツのみフィルタリング
    const gptsContents = allContents?.filter(content => 
      content.metadata?.source?.includes('gpts')
    ) || []
    
    // 統計情報を計算
    const now = new Date()
    const stats = {
      total: gptsContents.length,
      byPlatform: {},
      byStatus: {},
      byAge: {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        older: 0
      }
    }
    
    gptsContents.forEach(content => {
      // プラットフォーム別
      stats.byPlatform[content.platform] = (stats.byPlatform[content.platform] || 0) + 1
      
      // ステータス別
      stats.byStatus[content.status] = (stats.byStatus[content.status] || 0) + 1
      
      // 経過日数別
      const createdDate = new Date(content.created_at)
      const daysDiff = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24))
      
      if (daysDiff === 0) {
        stats.byAge.today++
      } else if (daysDiff <= 7) {
        stats.byAge.thisWeek++
      } else if (daysDiff <= 30) {
        stats.byAge.thisMonth++
      } else {
        stats.byAge.older++
      }
    })
    
    return NextResponse.json({
      statistics: stats,
      recommendation: stats.total > 40 ? 
        '古いコンテンツの削除を推奨します（DELETE /api/gpts/cleanup?days=30）' : 
        'まだ削除の必要はありません'
    }, {
      headers: getCorsHeaders()
    })
    
  } catch (error) {
    console.error('Statistics error:', error)
    return NextResponse.json(
      { error: 'Failed to get statistics' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}