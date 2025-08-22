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
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform')
    const status = searchParams.get('status')
    
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
    
    
    // GPTs由来のコンテンツのみフィルタリング
    // metadata.sourceがない場合もGPTsコンテンツとして扱う（後方互換性）
    let gptsContents = contents?.filter(content => {
      const source = content.metadata?.source
      
      // sourceが明示的に'manual'の場合は除外
      if (source === 'manual') {
        return false
      }
      
      // GPTs関連のソースは含める
      if (source && (
        source === 'gpts' || 
        source === 'gpts-universal' ||
        source === 'gpts-note' ||
        source === 'gpts-x' ||
        source === 'gpts-wordpress' ||
        source === 'gpts-multipart' ||
        source.includes('gpts')
      )) {
        return true
      }
      
      // sourceが未設定の場合もGPTsコンテンツとして扱う
      if (!source) {
        return true
      }
      
      return false
    }) || []
    
    // platformフィルター
    if (platform && platform !== 'all') {
      gptsContents = gptsContents.filter(content => content.platform === platform)
    }
    
    // statusフィルター
    if (status && status !== 'all') {
      gptsContents = gptsContents.filter(content => content.status === status)
    }
    
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