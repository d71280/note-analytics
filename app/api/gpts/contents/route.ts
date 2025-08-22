import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GPTs由来のコンテンツのみを取得
export async function GET() {
  try {
    const supabase = createAdminClient()
    
    // scheduled_postsテーブルから全てのコンテンツを取得
    const { data: allData, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
    
    if (error) {
      console.error('Failed to fetch posts:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch posts',
        details: error.message
      }, { status: 500 })
    }
    
    // GPTs由来のコンテンツのみフィルタリング（manual以外）
    const gptsContents = allData?.filter(post => {
      const source = post.metadata?.source
      return source !== 'manual'
    }) || []
    
    return NextResponse.json({
      success: true,
      total: gptsContents.length,
      contents: gptsContents
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}