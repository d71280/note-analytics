import { NextResponse } from 'next/server'

// CORS設定
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  })
}

// シンプル化されたOpenAPIスキーマ
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://note-analytics-platform.vercel.app'
  
  const schema = {
    openapi: '3.0.0',
    info: {
      title: 'Note Analytics Platform API',
      version: '1.0.0',
      description: 'API for sending content to Note Analytics Platform'
    },
    servers: [
      {
        url: baseUrl
      }
    ],
    paths: {
      '/api/gpts/receive-content': {
        post: {
          operationId: 'sendContent',
          summary: 'Send content to the platform',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['content', 'platform'],
                  properties: {
                    content: {
                      type: 'string',
                      description: 'The content text'
                    },
                    platform: {
                      type: 'string',
                      enum: ['note', 'x', 'wordpress'],
                      description: 'Target platform'
                    },
                    metadata: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        tags: {
                          type: 'array',
                          items: { type: 'string' }
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
              description: 'Content received successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      contentId: { type: 'string' },
                      message: { type: 'string' }
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
    headers: {
      ...getCorsHeaders(),
      'Content-Type': 'application/json',
    },
  })
}