import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// X APIを使わずに投稿成功をシミュレート
export async function POST() {
  try {
    const supabase = createClient()
    const now = new Date()
    
    // 過去の時刻でテスト投稿を作成
    const testPost = {
      content: 'ダミー投稿テスト: ' + now.toLocaleString('ja-JP'),
      platform: 'x' as const,
      scheduled_for: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), // 5分前
      status: 'pending' as const,
      metadata: {
        source: 'dummy-test',
        createdAt: now.toISOString()
      }
    }
    
    const { data: createdPost, error: createError } = await supabase
      .from('scheduled_posts')
      .insert(testPost)
      .select()
      .single()
    
    if (createError) {
      return NextResponse.json({
        error: 'Failed to create test post',
        details: createError.message
      }, { status: 500 })
    }
    
    console.log('Created test post:', createdPost.id)
    
    // 投稿処理をシミュレート（実際のAPIは呼ばない）
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 投稿成功として更新
    const { data: updatedPost, error: updateError } = await supabase
      .from('scheduled_posts')
      .update({
        status: 'posted',
        metadata: {
          ...createdPost.metadata,
          posted_at: now.toISOString(),
          dummy_post: true,
          post_id: 'dummy-' + Date.now()
        }
      })
      .eq('id', createdPost.id)
      .select()
      .single()
    
    if (updateError) {
      return NextResponse.json({
        error: 'Failed to update post status',
        details: updateError.message
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Dummy post created and marked as posted',
      post: updatedPost,
      note: 'This is a simulation - no actual post was sent to X'
    })
  } catch (error) {
    console.error('Error in dummy post:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}