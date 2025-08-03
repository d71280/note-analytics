import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // 知識ベースのリストを取得（最新順）
    const { data: items, error } = await supabase
      .from('knowledge_base')
      .select('id, title, content, content_type, tags, created_at, source_url')
      .order('created_at', { ascending: false })
      .limit(50) // 最新50件まで

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch knowledge base items' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      items: items || [],
      count: items?.length || 0
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}