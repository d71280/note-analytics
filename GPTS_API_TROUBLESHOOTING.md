# GPTs API連携トラブルシューティング

## 🔴 「APIが無効」エラーの解決方法

### 問題の原因
- APIエンドポイントが正しく設定されていない
- 認証情報が正しくない
- スキーマのフォーマットエラー

## ✅ 解決手順

### ステップ1: スキーマを手動で入力

1. GPTsの設定画面で「Import from URL」ではなく「**Enter manually**」を選択
2. 以下のスキーマをコピーして貼り付け：

```json
{
  "openapi": "3.1.0",
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
    "/api/gpts/receive-content": {
      "post": {
        "summary": "Send content to application",
        "operationId": "sendContent",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["content", "platform"],
                "properties": {
                  "content": {
                    "type": "string"
                  },
                  "platform": {
                    "type": "string",
                    "enum": ["x", "note", "wordpress"]
                  },
                  "metadata": {
                    "type": "object"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object"
                }
              }
            }
          }
        }
      }
    }
  }
}
```

### ステップ2: 認証設定を確認

1. **認証タイプ**: `API キー`を選択
2. **認証タイプ（詳細）**: `カスタム`を選択
3. **カスタムヘッダーの名前**: `x-api-key`
4. **API キー**: `gpts_aacce86a2a444bb06d9f5cb0c12b9e721e56760e610c1f8455b10666a8fe8dae`

### ステップ3: 保存とテスト

1. 「保存する」ボタンをクリック
2. GPTsのチャット画面でテスト：
   ```
   テスト投稿を作成してアプリケーションに送信してください
   ```

## 🔍 それでも動作しない場合

### 1. ドメインの許可設定を確認

GPTsの設定で「Privacy controls」セクションを確認：
- 「Send data to: note-analytics-platform.vercel.app」が許可されているか確認

### 2. 最小限のスキーマでテスト

以下の最小限のスキーマで試してください：

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "Test API",
    "version": "1.0"
  },
  "servers": [
    {
      "url": "https://note-analytics-platform.vercel.app"
    }
  ],
  "paths": {
    "/api/gpts/receive-content": {
      "post": {
        "operationId": "test",
        "responses": {
          "200": {
            "description": "OK"
          }
        }
      }
    }
  }
}
```

### 3. APIエンドポイントの動作確認

ターミナルで以下のコマンドを実行して、APIが正常に動作しているか確認：

```bash
curl -X POST https://note-analytics-platform.vercel.app/api/gpts/receive-content \
  -H "Content-Type: application/json" \
  -H "x-api-key: gpts_aacce86a2a444bb06d9f5cb0c12b9e721e56760e610c1f8455b10666a8fe8dae" \
  -d '{
    "content": "テスト投稿",
    "platform": "x"
  }'
```

## 📝 GPTs Instructions の修正版

以下の指示文をGPTsのInstructionsに設定：

```
あなたはX（Twitter）向けのコンテンツ生成専門家です。

## 重要な役割
ユーザーのリクエストに基づいて投稿を生成し、必ずsendContent APIを使用してアプリケーションに送信してください。

## APIの使用方法
生成したコンテンツは以下の形式で送信：
- content: 生成したテキスト（必須）
- platform: "x"（必須）
- metadata: 追加情報（オプション）

## コンテンツ生成ルール
- 最大280文字
- 日本語で簡潔に
- エンゲージメントを高める工夫を含める

重要: ユーザーが投稿を依頼したら、必ずAPIを呼び出してアプリケーションに送信すること。送信が成功したら「アプリケーションに送信しました」と報告。
```

## 🆘 サポート

上記の手順で解決しない場合は、以下の情報を確認してください：

1. Vercelのデプロイが成功しているか
2. 環境変数`GPTS_API_KEY`が設定されているか
3. Supabaseのテーブルが作成されているか

### デバッグ情報の取得

GPTsのチャット画面で以下を入力：
```
デバッグモードでAPIの状態を確認してください
```

これにより、API呼び出しの詳細なログが表示されます。