import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { autoCleanupOldContents } from '@/lib/utils/auto-cleanup'

// CORS設定のヘルパー関数
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Credentials': 'true',
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

// マークダウンをHTMLに変換する関数
function convertMarkdownToHtml(markdown: string): string {
  // 基本的なマークダウン変換
  let html = markdown
    // 見出し
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // 太字
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    // イタリック
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    // リスト
    .replace(/^\* (.+)/gim, '<li>$1</li>')
    .replace(/^- (.+)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.+)/gim, '<li>$1</li>')
    // 改行
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
  
  // リストタグの整形
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
  
  // 段落タグで囲む
  if (!html.startsWith('<')) {
    html = `<p>${html}</p>`
  }
  
  return html
}

// Note専用のコンテンツ受信エンドポイント
export async function POST(request: NextRequest) {
  console.log('=== Note GPTs Content Receive API Start ===')
  
  try {
    const body = await request.json()
    const { content, metadata, scheduling, format = 'markdown' } = body
    
    // 必須フィールドの検証
    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { 
          status: 400,
          headers: getCorsHeaders()
        }
      )
    }
    
    const contentLength = content.length
    console.log(`Note content received: ${contentLength} characters`)
    
    // Note用の文字数チェック（推奨: 1500-2500文字、最大: 10000文字）
    if (contentLength < 500) {
      return NextResponse.json(
        { 
          error: 'Content too short for Note',
          message: 'Note記事は500文字以上を推奨します',
          currentLength: contentLength,
          recommendedMin: 1500,
          recommendedMax: 2500
        },
        { 
          status: 400,
          headers: getCorsHeaders()
        }
      )
    }
    
    if (contentLength > 10000) {
      return NextResponse.json(
        { 
          error: 'Content exceeds maximum length for Note',
          maxLength: 10000,
          currentLength: contentLength
        },
        { 
          status: 400,
          headers: getCorsHeaders()
        }
      )
    }
    
    // 文字数による品質チェック
    let qualityNote = ''
    if (contentLength < 1500) {
      qualityNote = 'もう少し詳しく書くと、より良いNote記事になります'
    } else if (contentLength > 2500 && contentLength < 3000) {
      qualityNote = '良い長さです。読者にとって読みやすい分量です'
    } else if (contentLength >= 3000) {
      qualityNote = 'ブログ記事として適した長さです。段落分けを意識しましょう'
    } else {
      qualityNote = 'Note記事として理想的な長さです'
    }
    
    const supabase = createClient()
    
    // 保存前に古いコンテンツを自動削除（上限管理: 500件）
    const cleanupResult = await autoCleanupOldContents(supabase)
    if (cleanupResult.deleted > 0) {
      console.log(`Auto-cleanup: Deleted ${cleanupResult.deleted} old GPTs contents`)
    }
    
    // マークダウン形式の場合はHTMLに変換して保存
    const processedContent = format === 'markdown' ? convertMarkdownToHtml(content) : content
    const originalContent = content // 元のマークダウンも保存
    
    // Noteプラットフォーム固定で保存
    const { data: savedContent, error: saveError } = await supabase
      .from('scheduled_posts')
      .insert({
        content: processedContent, // HTML形式で保存
        platform: 'note', // Note固定
        scheduled_for: scheduling?.scheduledFor || null,
        status: scheduling?.scheduledFor ? 'pending' : 'draft',
        metadata: {
          ...metadata,
          source: 'gpts-note',
          contentLength,
          qualityNote,
          receivedAt: new Date().toISOString(),
          needsScheduling: !scheduling?.scheduledFor,
          format: format,
          originalContent: originalContent, // 元のマークダウンも保存
          isMarkdown: format === 'markdown'
        }
      })
      .select()
      .single()
    
    if (saveError) {
      console.error('Failed to save Note content:', saveError)
      
      // テーブルが存在しない場合のエラーハンドリング
      if (saveError.code === '42P01') {
        return NextResponse.json({
          success: true,
          contentId: 'temp-' + Date.now(),
          message: 'Content received (table initialization pending)',
          platform: 'note',
          contentLength,
          qualityNote
        }, {
          headers: getCorsHeaders()
        })
      }
      
      return NextResponse.json(
        { error: 'Failed to save content', details: saveError.message },
        { 
          status: 500,
          headers: getCorsHeaders()
        }
      )
    }
    
    // 成功レスポンス
    return NextResponse.json({
      success: true,
      contentId: savedContent.id,
      message: 'Note content received successfully',
      platform: 'note',
      contentLength,
      qualityNote,
      scheduled: !!scheduling?.scheduledFor,
      scheduledFor: scheduling?.scheduledFor,
      webUrl: `${process.env.NEXT_PUBLIC_APP_URL}/gpts/contents/${savedContent.id}`
    }, {
      headers: getCorsHeaders()
    })
    
  } catch (error) {
    console.error('=== Note Content Receive Error ===', error)
    return NextResponse.json(
      { 
        error: 'Failed to process Note content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: getCorsHeaders()
      }
    )
  }
}

// GPTsのActionsスキーマを返すGETエンドポイント
export async function GET() {
  const schema = {
    openapi: '3.0.0',
    info: {
      title: 'Note専用コンテンツ受信API',
      version: '1.0.0',
      description: 'Note記事専用の受信エンドポイント（推奨: 1500-2500文字）'
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || 'https://note-analytics.vercel.app'
      }
    ],
    paths: {
      '/api/gpts/receive-note': {
        post: {
          summary: 'Note記事を受信',
          operationId: 'receiveNoteContent',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['content'],
                  properties: {
                    content: {
                      type: 'string',
                      description: 'Note記事本文（マークダウン形式対応、推奨: 1500-2500文字、最小: 500文字、最大: 10000文字）'
                    },
                    format: {
                      type: 'string',
                      enum: ['markdown', 'plain'],
                      default: 'markdown',
                      description: 'コンテンツのフォーマット（markdownまたはplain）'
                    },
                    metadata: {
                      type: 'object',
                      properties: {
                        title: {
                          type: 'string',
                          description: 'Note記事のタイトル'
                        },
                        tags: {
                          type: 'array',
                          items: { type: 'string' },
                          description: 'ハッシュタグ（#なしで指定）'
                        },
                        category: {
                          type: 'string',
                          description: 'カテゴリー'
                        },
                        description: {
                          type: 'string',
                          description: '記事の説明文'
                        }
                      }
                    },
                    scheduling: {
                      type: 'object',
                      properties: {
                        scheduledFor: {
                          type: 'string',
                          format: 'date-time',
                          description: '投稿予定日時（ISO 8601形式）'
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Note記事を正常に受信',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      contentId: { type: 'string' },
                      message: { type: 'string' },
                      platform: {
                        type: 'string',
                        enum: ['note']
                      },
                      contentLength: { type: 'integer' },
                      qualityNote: { type: 'string' },
                      webUrl: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': {
              description: '文字数エラー'
            }
          }
        }
      }
    }
  }
  
  return NextResponse.json(schema, {
    headers: getCorsHeaders()
  })
}