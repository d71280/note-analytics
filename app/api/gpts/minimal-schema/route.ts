import { NextResponse } from 'next/server'

// 最小限のOpenAPIスキーマ - GPTsエラー回避用
export async function GET() {
  const schema = {
    "openapi": "3.0.0",
    "info": {
      "title": "Note Analytics API",
      "version": "1.0.0"
    },
    "servers": [
      {
        "url": "https://note-analytics-platform.vercel.app"
      }
    ],
    "paths": {
      "/api/gpts/test-send": {
        "post": {
          "operationId": "sendContent",
          "summary": "Send content",
          "requestBody": {
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "content": {
                      "type": "string"
                    },
                    "platform": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Success"
            }
          }
        }
      }
    }
  }

  return NextResponse.json(schema, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    }
  })
}