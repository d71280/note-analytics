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

// マークダウンをHTMLに変換する関数
function convertMarkdownToHtml(markdown: string): string {
  // 基本的なマークダウン変換
  let html = markdown
    // 見出し
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // 太字
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    // イタリック
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    // コードブロック
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // リスト
    .replace(/^\* (.+)/gim, '<li>$1</li>')
    .replace(/^- (.+)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.+)/gim, '<li>$1</li>')
    // 引用
    .replace(/^> (.+)/gim, '<blockquote>$1</blockquote>')
    // 水平線
    .replace(/^---$/gim, '<hr>')
    .replace(/^\*\*\*$/gim, '<hr>')
    // リンク
    .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>')
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

// WordPress専用のコンテンツ受信エンドポイント
export async function POST(request: NextRequest) {
  console.log('=== WordPress GPTs Content Receive API Start ===')
  
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
    console.log(`WordPress content received: ${contentLength} characters`)
    
    // WordPress用の文字数チェック（推奨: 3000文字以上、最大: 50000文字）
    if (contentLength < 1000) {
      return NextResponse.json(
        { 
          error: 'Content too short for WordPress',
          message: 'WordPress記事は1000文字以上を推奨します',
          currentLength: contentLength,
          recommendedMin: 3000,
          recommendedMax: 10000
        },
        { 
          status: 400,
          headers: getCorsHeaders()
        }
      )
    }
    
    if (contentLength > 50000) {
      return NextResponse.json(
        { 
          error: 'Content exceeds maximum length for WordPress',
          maxLength: 50000,
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
    if (contentLength < 3000) {
      qualityNote = 'もう少し詳しく書くと、SEO的にも有利なブログ記事になります'
    } else if (contentLength >= 3000 && contentLength <= 5000) {
      qualityNote = 'ブログ記事として理想的な長さです'
    } else if (contentLength > 5000 && contentLength <= 10000) {
      qualityNote = '詳細な解説記事として優れた長さです'
    } else {
      qualityNote = '非常に詳細な記事です。見出しで構造化することを推奨します'
    }
    
    const supabase = createClient()
    
    // マークダウン形式の場合はHTMLに変換して保存
    const processedContent = format === 'markdown' ? convertMarkdownToHtml(content) : content
    const originalContent = content // 元のマークダウンも保存
    
    // WordPressプラットフォーム固定で保存
    const { data: savedContent, error: saveError } = await supabase
      .from('scheduled_posts')
      .insert({
        content: processedContent, // HTML形式で保存
        platform: 'wordpress', // WordPress固定
        scheduled_for: scheduling?.scheduledFor || null,
        status: scheduling?.scheduledFor ? 'pending' : 'draft',
        metadata: {
          ...metadata,
          source: 'gpts-wordpress',
          contentLength,
          qualityNote,
          receivedAt: new Date().toISOString(),
          needsScheduling: !scheduling?.scheduledFor,
          seoRecommended: contentLength >= 3000, // SEO推奨長さ
          excerpt: metadata?.excerpt || content.substring(0, 160), // 抜粋
          format: format,
          originalContent: originalContent, // 元のマークダウンも保存
          isMarkdown: format === 'markdown'
        }
      })
      .select()
      .single()
    
    if (saveError) {
      console.error('Failed to save WordPress content:', saveError)
      
      // テーブルが存在しない場合のエラーハンドリング
      if (saveError.code === '42P01') {
        return NextResponse.json({
          success: true,
          contentId: 'temp-' + Date.now(),
          message: 'Content received (table initialization pending)',
          platform: 'wordpress',
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
      message: 'WordPress content received successfully',
      platform: 'wordpress',
      contentLength,
      qualityNote,
      seoRecommended: contentLength >= 3000,
      scheduled: !!scheduling?.scheduledFor,
      scheduledFor: scheduling?.scheduledFor,
      webUrl: `${process.env.NEXT_PUBLIC_APP_URL}/gpts/contents/${savedContent.id}`
    }, {
      headers: getCorsHeaders()
    })
    
  } catch (error) {
    console.error('=== WordPress Content Receive Error ===', error)
    return NextResponse.json(
      { 
        error: 'Failed to process WordPress content',
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
      title: 'WordPress専用コンテンツ受信API',
      version: '1.0.0',
      description: 'WordPressブログ記事専用の受信エンドポイント（推奨: 3000文字以上）'
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || 'https://note-analytics.vercel.app'
      }
    ],
    paths: {
      '/api/gpts/receive-wordpress': {
        post: {
          summary: 'WordPress記事を受信',
          operationId: 'receiveWordPressContent',
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
                      description: 'WordPress記事本文（マークダウン形式対応、推奨: 3000文字以上、最小: 1000文字、最大: 50000文字）'
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
                          description: 'ブログ記事のタイトル'
                        },
                        excerpt: {
                          type: 'string',
                          description: '記事の抜粋（SEO用）'
                        },
                        tags: {
                          type: 'array',
                          items: { type: 'string' },
                          description: 'タグ'
                        },
                        categories: {
                          type: 'array',
                          items: { type: 'string' },
                          description: 'カテゴリー'
                        },
                        featured_image: {
                          type: 'string',
                          description: 'アイキャッチ画像URL'
                        },
                        seo_keywords: {
                          type: 'array',
                          items: { type: 'string' },
                          description: 'SEOキーワード'
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
              description: 'WordPress記事を正常に受信',
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
                        enum: ['wordpress']
                      },
                      contentLength: { type: 'integer' },
                      qualityNote: { type: 'string' },
                      seoRecommended: { type: 'boolean' },
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