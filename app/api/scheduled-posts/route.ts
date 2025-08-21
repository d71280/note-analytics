import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .order('scheduled_for', { ascending: false, nullsFirst: false })
    
    if (error) {
      console.error('Failed to fetch scheduled posts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch scheduled posts' },
        { status: 500 }
      )
    }
    
    // 手動で作成された投稿のみ表示（GPTs由来を除外）
    const filteredData = (data || []).filter(post => {
      const source = post.metadata?.source
      
      // sourceが'manual'の場合のみ含める
      // sourceが未設定の場合はGPTs由来として除外
      return source === 'manual'
    })
    
    return NextResponse.json(filteredData)
  } catch (error) {
    console.error('Error fetching scheduled posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, platform, scheduled_for, metadata } = body
    
    if (!content || !platform) {
      return NextResponse.json(
        { error: 'Content and platform are required' },
        { status: 400 }
      )
    }
    
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('scheduled_posts')
      .insert({
        content,
        platform,
        scheduled_for: scheduled_for || null,
        status: scheduled_for ? 'pending' : 'draft',
        metadata: {
          ...metadata,
          source: 'manual' // 手動作成の投稿であることを明示
        }
      })
      .select()
      .single()
    
    if (error) {
      console.error('Failed to create scheduled post:', error)
      return NextResponse.json(
        { error: 'Failed to create scheduled post' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating scheduled post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}