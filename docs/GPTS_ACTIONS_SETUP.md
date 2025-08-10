# GPTs Actions 自動送信設定ガイド

このガイドでは、GPTsから自動的にコンテンツをNote Analytics Platformに送信する設定方法を説明します。

## 📋 前提条件

- ChatGPT Plus または Team/Enterprise アカウント
- Note Analytics Platformが稼働中（Vercelにデプロイ済み）

## 🚀 セットアップ手順

### 1. GPTsビルダーを開く

1. ChatGPTにログイン
2. 左サイドバーの「Explore」をクリック
3. 「Create a GPT」をクリック

### 2. GPTの基本設定

**Name（名前）:**
```
Note Content Generator
```

**Description（説明）:**
```
noteプラットフォーム向けのコンテンツを生成し、自動的にNote Analytics Platformに送信します。
```

**Instructions（指示）:**
```
あなたはnoteプラットフォーム向けのコンテンツ生成アシスタントです。

主な機能：
1. ユーザーのリクエストに基づいてnote記事を生成
2. 生成したコンテンツを自動的にNote Analytics Platformに送信
3. スケジュール投稿の設定サポート

コンテンツ生成時の注意点：
- noteは最大3000文字まで
- X（Twitter）は280文字まで
- タイトル、タグ、カテゴリーを適切に設定
- 読みやすく、価値のあるコンテンツを生成

自動送信プロセス：
1. コンテンツ生成後、必ずsendContent actionを使用して送信
2. 送信成功時はcontentIdとwebUrlをユーザーに通知
3. エラー時は適切なエラーメッセージを表示
```

### 3. Actions設定

1. GPTビルダーの「Configure」タブをクリック
2. 「Create new action」をクリック
3. 以下の内容を設定：

#### Schema（スキーマ）

以下のURLの内容をコピー＆ペースト：
```
https://note-analytics-platform.vercel.app/gpts-openapi-schema.json
```

または、以下のJSONを直接貼り付け：

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "Note Analytics Platform API",
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
        "operationId": "sendContent",
        "summary": "Send content to platform",
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
                    "enum": ["note", "x", "wordpress"]
                  },
                  "metadata": {
                    "type": "object",
                    "properties": {
                      "title": {"type": "string"},
                      "tags": {"type": "array", "items": {"type": "string"}},
                      "category": {"type": "string"}
                    }
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
```

#### Authentication（認証）

1. Type: `API Key`
2. Header name: `x-api-key`
3. API Key: `test-api-key-12345`（テスト用）

### 4. プライバシーポリシー設定（オプション）

Privacy policy URL:
```
https://note-analytics-platform.vercel.app/privacy
```

### 5. 動作テスト

以下のプロンプトでテストしてください：

```
「AIとクリエイティビティの未来」というテーマでnote記事を生成して、自動送信してください。
タグは #AI #クリエイティブ #テクノロジー を付けてください。
```

## 📝 使用例

### 基本的な使用方法

```
「[テーマ]」についてnote記事を生成して送信してください。
```

### スケジュール投稿

```
「[テーマ]」についての記事を生成して、明日の10時に投稿するようスケジュールしてください。
```

### 複数プラットフォーム対応

```
「[テーマ]」について：
- note用の詳細記事（2000文字程度）
- X用の要約（280文字以内）
を生成して送信してください。
```

## 🔧 トラブルシューティング

### エラー: "Invalid API key"

1. Actions設定でAPI keyが正しく設定されているか確認
2. Header nameが `x-api-key` になっているか確認

### エラー: "Failed to send content"

1. Note Analytics Platformが稼働しているか確認
2. URLが正しいか確認（httpsであることを確認）

### CORS エラー

すでに対応済みですが、もし発生した場合：
1. ブラウザのキャッシュをクリア
2. GPTを再度保存

## 🎯 高度な使用方法

### カスタムプロンプトテンプレート

```
私のGPTの標準動作：
1. ユーザーのテーマを受け取る
2. 以下の構造でコンテンツを生成：
   - 導入（問題提起）
   - 本文（3つのポイント）
   - 結論（行動喚起）
3. 適切なタグとカテゴリーを自動設定
4. sendContentアクションで自動送信
5. 送信結果をユーザーに報告
```

### APIキーの本番運用

本番環境では、以下の手順で独自のAPIキーを生成：

1. Note Analytics Platformの設定画面にアクセス
2. 「APIキー管理」から新しいキーを生成
3. GPTsのActions設定で、生成したキーに置き換え

## 📚 参考リンク

- [OpenAI GPTs Documentation](https://platform.openai.com/docs/guides/gpts)
- [Note Analytics Platform](https://note-analytics-platform.vercel.app)

## サポート

問題が発生した場合は、以下をお試しください：
1. このガイドの手順を再確認
2. GPTを一度削除して再作成
3. ブラウザを更新してキャッシュをクリア