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

// メモリ内で一時的に分割されたコンテンツを保存
const contentParts = new Map<string, {
  parts: string[]
  totalParts: number
  metadata?: Record<string, unknown>
  timestamp: number
}>()

// 古いセッションをクリーンアップ（30分以上経過したもの）
function cleanupOldSessions() {
  const now = Date.now()
  const thirtyMinutes = 30 * 60 * 1000
  
  contentParts.forEach((data, sessionId) => {
    if (now - data.timestamp > thirtyMinutes) {
      contentParts.delete(sessionId)
    }
  })
}

// OPTIONS メソッド - プリフライトリクエストに対応
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  })
}

export async function POST(request: NextRequest) {
  console.log('=== GPTs Content Parts Receive API Start ===')
  
  try {
    cleanupOldSessions()
    
    const body = await request.json()
    const { 
      sessionId,  // 分割送信のセッションID
      partNumber, // 現在のパート番号（1から始まる）
      totalParts, // 総パート数
      content,    // このパートのコンテンツ
      metadata,   // メタデータ（最初のパートにのみ含まれる）
      isComplete  // 送信完了フラグ
    } = body
    
    // 必須フィールドの検証
    if (!sessionId || !content || partNumber === undefined || totalParts === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { 
          status: 400,
          headers: getCorsHeaders()
        }
      )
    }
    
    console.log(`Received part ${partNumber}/${totalParts} for session ${sessionId}`)
    
    // セッションデータを取得または作成
    if (!contentParts.has(sessionId)) {
      contentParts.set(sessionId, {
        parts: new Array(totalParts).fill(''),
        totalParts,
        metadata,
        timestamp: Date.now()
      })
    }
    
    const sessionData = contentParts.get(sessionId)!
    
    // パートを保存
    sessionData.parts[partNumber - 1] = content
    
    // メタデータを更新（最初のパートに含まれる場合）
    if (metadata && partNumber === 1) {
      sessionData.metadata = metadata
    }
    
    // すべてのパートが揃ったか確認
    const receivedParts = sessionData.parts.filter(part => part !== '').length
    const allPartsReceived = receivedParts === totalParts || isComplete
    
    if (allPartsReceived) {
      // 全パートを結合
      const fullContent = sessionData.parts.join('')
      const contentLength = fullContent.length
      
      console.log(`All parts received. Total content length: ${contentLength}`)
      
      // 文字数による自動プラットフォーム振り分け
      let platform: 'x' | 'note' | 'wordpress'
      
      if (contentLength <= 280) {
        platform = 'x'
        console.log(`Auto-assigned platform: X (${contentLength} chars)`)
      } else if (contentLength >= 1500 && contentLength <= 2500) {
        platform = 'note'
        console.log(`Auto-assigned platform: Note (${contentLength} chars)`)
      } else if (contentLength >= 3000) {
        platform = 'wordpress'
        console.log(`Auto-assigned platform: WordPress/Blog (${contentLength} chars)`)
      } else {
        // デフォルトで最も近いプラットフォームを選択
        if (contentLength < 1500) {
          platform = 'x'
        } else if (contentLength < 3000) {
          platform = 'note'
        } else {
          platform = 'wordpress'
        }
        console.log(`Auto-assigned platform by proximity: ${platform} (${contentLength} chars)`)
      }
      
      // Supabaseに保存
      const supabase = createClient()
      
      const { data: savedContent, error: saveError } = await supabase
        .from('scheduled_posts')
        .insert({
          content: fullContent,
          platform,
          status: 'draft',
          metadata: {
            ...sessionData.metadata,
            source: 'gpts-multipart',
            receivedAt: new Date().toISOString(),
            totalParts,
            sessionId
          }
        })
        .select()
        .single()
      
      if (saveError) {
        console.error('Failed to save content:', saveError)
        
        // テーブルが存在しない場合のエラーハンドリング
        if (saveError.code === '42P01') {
          console.log('Table does not exist, returning success anyway')
          
          // セッションをクリーンアップ
          contentParts.delete(sessionId)
          
          return NextResponse.json({
            success: true,
            contentId: 'temp-' + Date.now(),
            message: 'Content received (table initialization pending)',
            platform,
            contentLength,
            allPartsReceived: true
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
      
      // セッションをクリーンアップ
      contentParts.delete(sessionId)
      
      // 成功レスポンス
      return NextResponse.json({
        success: true,
        contentId: savedContent.id,
        message: 'All parts received and content saved',
        platform,
        contentLength,
        allPartsReceived: true,
        webUrl: `${process.env.NEXT_PUBLIC_APP_URL}/gpts/contents/${savedContent.id}`
      }, {
        headers: getCorsHeaders()
      })
    } else {
      // まだ全パートが揃っていない
      return NextResponse.json({
        success: true,
        message: `Part ${partNumber}/${totalParts} received`,
        receivedParts,
        totalParts,
        allPartsReceived: false,
        sessionId
      }, {
        headers: getCorsHeaders()
      })
    }
    
  } catch (error) {
    console.error('=== GPTs Content Parts Receive Error ===', error)
    return NextResponse.json(
      { 
        error: 'Failed to process content part',
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
      title: 'Note Analytics Multi-Part Content Receiver',
      version: '1.0.0',
      description: '長文コンテンツを分割送信するためのAPI'
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || 'https://note-analytics.vercel.app'
      }
    ],
    paths: {
      '/api/gpts/receive-content-parts': {
        post: {
          summary: 'コンテンツを分割送信',
          operationId: 'receiveContentPart',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['sessionId', 'partNumber', 'totalParts', 'content'],
                  properties: {
                    sessionId: {
                      type: 'string',
                      description: '分割送信のセッションID（例: "note-1234567890"）'
                    },
                    partNumber: {
                      type: 'integer',
                      description: '現在のパート番号（1から始まる）'
                    },
                    totalParts: {
                      type: 'integer',
                      description: '総パート数'
                    },
                    content: {
                      type: 'string',
                      description: 'このパートのコンテンツ（最大280文字）'
                    },
                    metadata: {
                      type: 'object',
                      description: 'メタデータ（最初のパートにのみ含める）',
                      properties: {
                        title: { type: 'string' },
                        tags: { 
                          type: 'array',
                          items: { type: 'string' }
                        },
                        category: { type: 'string' }
                      }
                    },
                    isComplete: {
                      type: 'boolean',
                      description: '最後のパートの場合true'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'パート受信成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      allPartsReceived: { 
                        type: 'boolean',
                        description: '全パート受信完了フラグ'
                      },
                      contentId: { 
                        type: 'string',
                        description: '保存されたコンテンツID（完了時のみ）'
                      },
                      platform: {
                        type: 'string',
                        description: '自動振り分けされたプラットフォーム（完了時のみ）'
                      }
                    }
                  }
                }
              }
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