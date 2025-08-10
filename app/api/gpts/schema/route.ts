import { NextResponse } from 'next/server'

// CORS設定のヘルパー関数
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
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

// GPTs Actions用のOpenAPIスキーマを返す
export async function GET() {
  const schema = {
    openapi: '3.1.0',
    info: {
      title: 'Note Analytics Platform API for GPTs',
      description: 'API for receiving and managing content from GPTs. This API allows GPTs to automatically send generated content to the Note Analytics Platform.',
      version: '1.0.0',
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || 'https://note-analytics-platform.vercel.app',
        description: 'Production server',
      },
    ],
    paths: {
      '/api/gpts/test': {
        get: {
          operationId: 'testConnection',
          summary: 'Test API connection',
          description: 'Simple endpoint to verify the API connection is working',
          responses: {
            '200': {
              description: 'Connection successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string' },
                      message: { type: 'string' },
                      timestamp: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/gpts/receive-content': {
        post: {
          operationId: 'sendContent',
          summary: 'Send generated content to platform',
          description: 'Automatically sends AI-generated content to the platform for scheduling and posting to note, X (Twitter), or WordPress',
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
                      description: 'The generated content text (max 3000 chars for note, 280 for X)',
                      example: 'AIの進化により、コンテンツ制作の効率性が大幅に向上しています。',
                    },
                    platform: {
                      type: 'string',
                      enum: ['note', 'x', 'wordpress'],
                      description: 'Target platform for the content',
                      example: 'note',
                    },
                    metadata: {
                      type: 'object',
                      description: 'Additional metadata',
                      properties: {
                        title: {
                          type: 'string',
                          description: 'Content title (for note/wordpress)',
                          example: 'AI活用コンテンツ制作の未来',
                        },
                        tags: {
                          type: 'array',
                          items: { type: 'string' },
                          description: 'Content tags',
                          example: ['AI', 'GPTs', 'コンテンツ制作'],
                        },
                        category: {
                          type: 'string',
                          description: 'Content category',
                          example: 'テクノロジー',
                        },
                        generatedBy: {
                          type: 'string',
                          default: 'GPTs',
                          description: 'Source of generation',
                        },
                        model: {
                          type: 'string',
                          default: 'gpt-4',
                          description: 'Model used',
                        },
                        prompt: {
                          type: 'string',
                          description: 'Original prompt',
                        },
                      },
                    },
                    scheduling: {
                      type: 'object',
                      description: 'Scheduling options',
                      properties: {
                        scheduledFor: {
                          type: 'string',
                          format: 'date-time',
                          description: 'ISO 8601 datetime for scheduling',
                          example: '2025-08-11T10:00:00Z',
                        },
                        timezone: {
                          type: 'string',
                          default: 'Asia/Tokyo',
                          description: 'Timezone',
                        },
                      },
                    },
                  },
                },
              },
            },
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
                      message: { type: 'string' },
                      webUrl: { type: 'string' },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Bad request',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/gpts/contents': {
        get: {
          operationId: 'getContents',
          summary: 'Get list of contents',
          description: 'Retrieves all contents received from GPTs',
          responses: {
            '200': {
              description: 'Contents retrieved',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      contents: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            content: { type: 'string' },
                            platform: { type: 'string' },
                            status: { type: 'string' },
                            created_at: { type: 'string' },
                          },
                        },
                      },
                      total: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key for authentication. For testing, use: test-api-key-12345',
        },
      },
    },
  }

  return NextResponse.json(schema, {
    headers: {
      ...getCorsHeaders(),
      'Content-Type': 'application/json',
    },
  })
}