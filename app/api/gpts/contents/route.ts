import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
    const supabase = createAdminClient()
    
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
      .limit(500)
    
    if (error) {
      console.error('Failed to fetch contents:', error)
      return NextResponse.json(
        { error: 'Failed to fetch contents' },
        { status: 500, headers: getCorsHeaders() }
      )
    }
    
    // デバッグ: 全コンテンツのソースを確認
    console.log('All contents sources:', contents?.map(c => ({
      id: c.id,
      source: c.metadata?.source,
      platform: c.platform,
      hasMetadata: !!c.metadata
    })))
    
    // GPTs由来のコンテンツのみフィルタリング（universalも含む）
    const gptsContents = contents?.filter(content => {
      const source = content.metadata?.source
      const isGpts = source === 'gpts' || 
             source === 'gpts-universal' ||
             source === 'gpts-note' ||
             source === 'gpts-x' ||
             source === 'gpts-wordpress' ||
             source === 'gpts-multipart' ||
             (typeof source === 'string' && source.includes('gpts'))
      
      if (isGpts) {
        console.log(`Including GPTs content: ${content.id} (source: ${source})`)
      }
      return isGpts
    }) || []
    
    // データを整形
    const formattedContents = gptsContents.map(content => ({
      id: content.id,
      content: content.content,
      platform: content.platform,
      status: content.status,
      scheduled_for: content.scheduled_for,
      created_at: content.created_at,
      metadata: {
        source: content.metadata?.source, // sourceを保持
        title: content.metadata?.title,
        tags: content.metadata?.tags,
        category: content.metadata?.category,
        generatedBy: content.metadata?.generatedBy,
        model: content.metadata?.model,
        prompt: content.metadata?.prompt,
        receivedAt: content.metadata?.receivedAt,
        needsScheduling: content.metadata?.needsScheduling
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