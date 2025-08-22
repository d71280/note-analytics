import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// 保存されたコンテンツの一覧を取得
export async function GET() {
  try {
    const supabase = createAdminClient()
    
    // scheduled_postsテーブルから全てのコンテンツを取得し、後でフィルタリング
    const { data: allData, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
    
    // GPTs由来のコンテンツのみフィルタリング
    const data = allData?.filter(post => {
      const source = post.metadata?.source
      // manualソース以外、またはsourceが未定義のものを含める
      return source !== 'manual'
    }) || []
    
    if (error) {
      console.error('Failed to fetch posts:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch posts',
        details: error.message,
        hint: 'Check if the table exists and has proper permissions'
      }, {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      posts: data || [],
      message: data?.length > 0 ? 'Posts found' : 'No posts found'
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    })
  }
}