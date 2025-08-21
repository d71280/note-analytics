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
    
    // GPTs由来の投稿を除外（手動でスケジュールした投稿のみ表示）
    const filteredData = (data || []).filter(post => {
      const source = post.metadata?.source
      // GPTs関連のソースを除外
      if (source && (
        source.includes('gpts') ||
        source === 'chatgpt' ||
        source === 'openai'
      )) {
        return false
      }
      return true
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
        metadata: metadata || {}
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