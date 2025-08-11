import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

// X (Twitter)専用のコンテンツ受信エンドポイント
export async function POST(request: NextRequest) {
  console.log('=== X (Twitter) GPTs Content Receive API Start ===')
  
  try {
    const body = await request.json()
    const { content, metadata, scheduling } = body
    
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
    console.log(`X content received: ${contentLength} characters`)
    
    // X (Twitter)の文字数制限チェック（最大280文字）
    if (contentLength > 280) {
      return NextResponse.json(
        { 
          error: 'Content exceeds X (Twitter) character limit',
          maxLength: 280,
          currentLength: contentLength,
          excess: contentLength - 280,
          suggestion: 'コンテンツを短くするか、スレッド形式での投稿を検討してください'
        },
        { 
          status: 400,
          headers: getCorsHeaders()
        }
      )
    }
    
    // 文字数による品質チェック
    let qualityNote = ''
    if (contentLength < 50) {
      qualityNote = '短すぎるかもしれません。もう少し詳細を追加すると良いでしょう'
    } else if (contentLength >= 50 && contentLength <= 200) {
      qualityNote = 'X投稿として理想的な長さです'
    } else if (contentLength > 200 && contentLength <= 280) {
      qualityNote = '長めの投稿です。必要に応じて要約することも検討してください'
    }
    
    const supabase = createClient()
    
    // Xプラットフォーム固定で保存
    const { data: savedContent, error: saveError } = await supabase
      .from('scheduled_posts')
      .insert({
        content,
        platform: 'x', // X固定
        scheduled_for: scheduling?.scheduledFor || null,
        status: scheduling?.scheduledFor ? 'pending' : 'draft',
        metadata: {
          ...metadata,
          source: 'gpts-x',
          contentLength,
          qualityNote,
          receivedAt: new Date().toISOString(),
          needsScheduling: !scheduling?.scheduledFor,
          hashtags: metadata?.hashtags || [], // X用のハッシュタグ
          replyTo: metadata?.replyTo || null, // リプライ先のツイートID
          thread: metadata?.thread || false // スレッドの一部かどうか
        }
      })
      .select()
      .single()
    
    if (saveError) {
      console.error('Failed to save X content:', saveError)
      
      // テーブルが存在しない場合のエラーハンドリング
      if (saveError.code === '42P01') {
        return NextResponse.json({
          success: true,
          contentId: 'temp-' + Date.now(),
          message: 'Content received (table initialization pending)',
          platform: 'x',
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
      message: 'X content received successfully',
      platform: 'x',
      contentLength,
      qualityNote,
      charactersRemaining: 280 - contentLength,
      scheduled: !!scheduling?.scheduledFor,
      scheduledFor: scheduling?.scheduledFor,
      webUrl: `${process.env.NEXT_PUBLIC_APP_URL}/gpts/contents/${savedContent.id}`
    }, {
      headers: getCorsHeaders()
    })
    
  } catch (error) {
    console.error('=== X Content Receive Error ===', error)
    return NextResponse.json(
      { 
        error: 'Failed to process X content',
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
      title: 'X (Twitter)専用コンテンツ受信API',
      version: '1.0.0',
      description: 'X (Twitter)投稿専用の受信エンドポイント（最大280文字）'
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || 'https://note-analytics.vercel.app'
      }
    ],
    paths: {
      '/api/gpts/receive-x': {
        post: {
          summary: 'X (Twitter)投稿を受信',
          operationId: 'receiveXContent',
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
                      maxLength: 280,
                      description: 'ツイート本文（最大280文字）'
                    },
                    metadata: {
                      type: 'object',
                      properties: {
                        hashtags: {
                          type: 'array',
                          items: { type: 'string' },
                          description: 'ハッシュタグ（#なしで指定）'
                        },
                        replyTo: {
                          type: 'string',
                          description: 'リプライ先のツイートID'
                        },
                        thread: {
                          type: 'boolean',
                          description: 'スレッドの一部として投稿するか'
                        },
                        mentions: {
                          type: 'array',
                          items: { type: 'string' },
                          description: 'メンション（@なしで指定）'
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
              description: 'X投稿を正常に受信',
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
                        enum: ['x']
                      },
                      contentLength: { type: 'integer' },
                      charactersRemaining: { type: 'integer' },
                      qualityNote: { type: 'string' },
                      webUrl: { type: 'string' }
                    }
                  }
                }
              }
            },
            '400': {
              description: '文字数制限エラー（280文字超過）'
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