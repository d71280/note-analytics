import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// CORS設定のヘルパー関数
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
    'Access-Control-Max-Age': '86400',
  }
}

// OPTIONS メソッド - プリフライトリクエストに対応
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  })
}

// GPTsから受信したコンテンツ一覧を取得
export async function GET() {
  try {
    const supabase = createClient()
    
    // まずscheduled_postsテーブルの存在を確認
    const { error: tableError } = await supabase
      .from('scheduled_posts')
      .select('id')
      .limit(1)
    
    if (tableError?.code === '42P01') {
      // テーブルが存在しない場合は作成
      const { error: createError } = await supabase.rpc('create_scheduled_posts_table', {})
      
      if (createError) {
        // RPCが存在しない場合は空配列を返す
        return NextResponse.json({ 
          contents: [],
          total: 0,
          message: 'Table not initialized yet'
        }, {
          headers: getCorsHeaders()
        })
      }
    }
    
    // scheduled_postsテーブルからGPTs由来のコンテンツを取得
    // metadata->>'source' の代わりに全件取得してフィルタリング
    const { data: contents, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (error) {
      console.error('Failed to fetch contents:', error)
      return NextResponse.json(
        { error: 'Failed to fetch contents' },
        { status: 500, headers: getCorsHeaders() }
      )
    }
    
    // GPTs由来のコンテンツのみフィルタリング
    const gptsContents = contents?.filter(content => 
      content.metadata?.source === 'gpts'
    ) || []
    
    // データを整形
    const formattedContents = gptsContents.map(content => ({
      id: content.id,
      content: content.content,
      platform: content.platform,
      status: content.status,
      scheduled_for: content.scheduled_for,
      created_at: content.created_at,
      metadata: {
        title: content.metadata?.title,
        tags: content.metadata?.tags,
        category: content.metadata?.category,
        generatedBy: content.metadata?.generatedBy,
        model: content.metadata?.model,
        prompt: content.metadata?.prompt,
      },
      received_at: content.metadata?.receivedAt || content.created_at
    })) || []
    
    return NextResponse.json({ 
      contents: formattedContents,
      total: formattedContents.length 
    }, {
      headers: getCorsHeaders()
    })
  } catch (error) {
    console.error('Failed to fetch contents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contents' },
      { status: 500 }
    )
  }
}