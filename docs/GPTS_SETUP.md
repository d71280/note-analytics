# GPTs Actions設定ガイド

## 1. Vercel環境変数の設定

まず、Vercelダッシュボードで環境変数を設定します：

```bash
# ターミナルから設定する場合
vercel env add GPTS_API_KEY
```

または、Vercelダッシュボード → Settings → Environment Variables から：
- 変数名: `GPTS_API_KEY`
- 値: 任意のセキュアな文字列（例: `sk-gpts-abc123xyz789`）
- 環境: Production, Preview, Development

## 2. ChatGPTでGPTを作成

1. https://chat.openai.com にアクセス
2. 左サイドバーの「Explore」をクリック
3. 「Create a GPT」をクリック

## 3. Actions設定

### Configure タブで：

1. **Name**: 例: "X Content Manager"
2. **Description**: X (Twitter)にコンテンツを投稿するGPT
3. **Instructions**: 
```
You help users create and manage X (Twitter) content. When users provide content, you send it to the API for storage and scheduling.
```

### Actions セクションで：

1. **Create new action** をクリック
2. **Authentication** で「API Key」を選択
3. **API Key** フィールドに、Vercelで設定した `GPTS_API_KEY` の値を入力
4. **Auth Type** は「Bearer」を選択

### Schema設定：

以下のOpenAPIスキーマを貼り付け：

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "X Content API",
    "version": "1.0.0",
    "description": "API for managing X (Twitter) content"
  },
  "servers": [
    {
      "url": "https://note-analytics.vercel.app"
    }
  ],
  "paths": {
    "/api/gpts/receive-x": {
      "post": {
        "summary": "Send X content",
        "description": "Send content to be posted on X (Twitter)",
        "operationId": "sendXContent",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["content"],
                "properties": {
                  "content": {
                    "type": "string",
                    "maxLength": 280,
                    "description": "The content to post on X (Twitter)"
                  },
                  "metadata": {
                    "type": "object",
                    "properties": {
                      "hashtags": {
                        "type": "array",
                        "items": {
                          "type": "string"
                        },
                        "description": "Hashtags without # symbol"
                      }
                    }
                  },
                  "scheduling": {
                    "type": "object",
                    "properties": {
                      "scheduledFor": {
                        "type": "string",
                        "format": "date-time",
                        "description": "When to post (ISO 8601 format)"
                      }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Content successfully received",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean"
                    },
                    "contentId": {
                      "type": "string"
                    },
                    "message": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Authentication required"
          },
          "403": {
            "description": "Invalid API key"
          }
        }
      }
    }
  }
}
```

## 4. テスト

1. **Test** ボタンをクリック
2. サンプルメッセージを入力：
   ```
   "AIの未来について280文字以内でツイートを作成して送信して"
   ```

3. GPTが自動的にコンテンツを生成し、APIに送信します

## 5. 認証なしで使用する場合

環境変数 `GPTS_API_KEY` を設定しない場合、認証なしでAPIを使用できます。

GPTsの設定で：
- **Authentication**: None を選択
- スキーマはそのまま使用可能

## トラブルシューティング

### "通信しています"で止まる場合
- サーバーURLが正しいか確認（`https://note-analytics.vercel.app`）
- APIキーが正しく設定されているか確認

### 403 Forbidden エラー
- Vercelの環境変数とGPTsのAPIキーが一致しているか確認
- Vercelでのデプロイが完了しているか確認

### CORS エラー
- 最新のコードがデプロイされているか確認
- ブラウザのキャッシュをクリア

## Note用エンドポイント

Note記事用のエンドポイントも利用可能：
- エンドポイント: `/api/gpts/receive-note`
- 文字数制限: 500-10000文字（推奨: 1500-2500文字）