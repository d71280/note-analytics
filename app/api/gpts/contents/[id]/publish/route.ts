import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient()
    
    // まずコンテンツが存在するか確認
    const { data: existingPost, error: fetchError } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (fetchError || !existingPost) {
      console.error('Post not found:', { id: params.id, error: fetchError })
      return NextResponse.json(
        { error: 'Post not found', details: fetchError?.message },
        { status: 404 }
      )
    }
    
    console.log('Found post to publish:', existingPost)
    
    // 投稿を公開状態に更新
    const { data, error } = await supabase
      .from('scheduled_posts')
      .update({
        status: 'published',
        published_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) {
      console.error('Failed to publish content:', { id: params.id, error, details: error.message })
      return NextResponse.json(
        { error: 'Failed to publish content', details: error.message },
        { status: 500 }
      )
    }
    
    console.log('Successfully published:', data)
    
    // TODO: 実際のプラットフォームへの投稿処理を実装
    // 例: X (Twitter) API, Note API, WordPress APIへの投稿
    
    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Publish error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}