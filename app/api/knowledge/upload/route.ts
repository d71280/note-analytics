import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// テキストを適切なサイズのチャンクに分割
function createChunks(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    const end = start + chunkSize
    const chunk = text.slice(start, end)
    chunks.push(chunk)
    start = end - overlap // オーバーラップして文脈を保持
  }

  return chunks
}

export async function POST(request: NextRequest) {
  try {
    const { title, content, contentType, tags, sourceUrl } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // コンテンツサイズのチェック（10MB制限）
    const contentSize = new Blob([content]).size
    if (contentSize > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Content size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // メインコンテンツを保存
    const { data: knowledge, error: knowledgeError } = await supabase
      .from('knowledge_base')
      .insert({
        title,
        content,
        content_type: contentType,
        tags,
        source_url: sourceUrl,
        created_date: new Date().toISOString()
      })
      .select()
      .single()

    if (knowledgeError) {
      console.error('Knowledge base error:', knowledgeError)
      return NextResponse.json(
        { error: `Failed to save content: ${knowledgeError.message}` },
        { status: 500 }
      )
    }

    // 長いコンテンツはチャンクに分割
    if (content.length > 1000) {
      const chunks = createChunks(content)
      const chunkData = chunks.map((chunk, index) => ({
        knowledge_id: knowledge.id,
        chunk_index: index,
        content: chunk
      }))

      const { error: chunkError } = await supabase
        .from('knowledge_chunks')
        .insert(chunkData)

      if (chunkError) {
        console.error('Chunk error:', chunkError)
      }
    }

    // TODO: OpenAI Embeddingsを生成してベクトルを保存
    // これは後で実装（OpenAI APIキーが必要）

    return NextResponse.json({
      success: true,
      id: knowledge.id,
      message: 'Content uploaded successfully'
    })
  } catch (error) {
    console.error('Upload error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}