# GPTs連携ガイド

## 📋 概要
このドキュメントでは、OpenAI GPTsとNote Analytics Platformを連携する方法を説明します。

## 🚀 セットアップ手順

### 1. APIキーの生成
1. Note Analytics Platformにアクセス
2. `/gpts/contents` ページに移動
3. 「APIキー」セクションで「新規生成」をクリック
4. 生成されたAPIキーをコピー

### 2. GPTsの設定

#### Actions設定
GPTsの「Configure」タブで以下を設定：

1. **Add actions** をクリック
2. **Authentication** を設定：
   - Type: `API Key`
   - Header name: `x-api-key`
   - API Key: `上記で生成したAPIキー`

3. **Schema** に以下のOpenAPI仕様を貼り付け：

```yaml
openapi: 3.0.0
info:
  title: Note Analytics Content API
  version: 1.0.0
  description: コンテンツをスケジューリング配信するためのAPI
servers:
  - url: https://your-app.vercel.app
paths:
  /api/gpts/receive-content:
    post:
      operationId: sendContent
      summary: 生成したコンテンツを送信
      description: GPTsで生成したコンテンツをNote Analyticsに送信してスケジューリング
      parameters:
        - name: x-api-key
          in: header
          required: true
          schema:
            type: string
          description: 認証用APIキー
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - content
                - platform
              properties:
                content:
                  type: string
                  description: 生成されたコンテンツ本文
                  example: "AIとビジネスの未来について考察した内容..."
                platform:
                  type: string
                  enum: [x, note, wordpress]
                  description: 配信先プラットフォーム
                metadata:
                  type: object
                  description: コンテンツのメタデータ
                  properties:
                    title:
                      type: string
                      description: コンテンツのタイトル
                    tags:
                      type: array
                      items:
                        type: string
                      description: タグのリスト
                    category:
                      type: string
                      description: カテゴリー
                    prompt:
                      type: string
                      description: 生成に使用したプロンプト
                scheduling:
                  type: object
                  description: スケジューリング設定
                  properties:
                    scheduledFor:
                      type: string
                      format: date-time
                      description: 配信予定日時 (ISO 8601形式)
                      example: "2024-01-20T10:00:00Z"
                    timezone:
                      type: string
                      description: タイムゾーン
                      default: "Asia/Tokyo"
                    repeat:
                      type: string
                      enum: [none, daily, weekly, monthly]
                      description: 繰り返し設定
                      default: none
      responses:
        '200':
          description: 成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  contentId:
                    type: string
                    description: 保存されたコンテンツのID
                  webUrl:
                    type: string
                    description: 管理画面のURL
                  scheduled:
                    type: boolean
                    description: スケジュール設定の有無
        '400':
          description: リクエストエラー
        '401':
          description: 認証エラー
```

### 3. GPTsのInstructionsテンプレート

以下のテンプレートをGPTsのInstructionsに追加：

```
## コンテンツ配信機能

ユーザーが生成したコンテンツをスケジュール配信したい場合、以下の手順で処理してください：

1. コンテンツを生成
2. プラットフォームを確認（X/Twitter、Note、WordPress）
3. 配信日時を確認（指定がない場合は確認する）
4. sendContent アクションを使用して送信

### 送信時の注意点：
- X/Twitter: 最大280文字
- Note: 最大3000文字  
- WordPress: 最大5000文字

### 送信例：
「このコンテンツを明日の10時にXに投稿して」と言われたら：
1. contentにテキストを設定
2. platformを"x"に設定
3. scheduledForを翌日10時のISO 8601形式に変換
4. sendContentアクションを実行

送信成功時は、返されたwebUrlをユーザーに共有して、管理画面で確認できることを伝えてください。
```

## 📝 使用例

### GPTsでの会話例

```
User: AIの未来についての投稿を作成して、明日の朝9時にXに投稿してください

GPTs: AIの未来についての投稿を作成しました。以下の内容を明日の朝9時にXに配信設定します：

「🤖 AIの進化は加速しています。2024年は対話型AIが日常に浸透し、私たちの働き方を根本から変える年になるでしょう。重要なのは、AIを道具として賢く活用し、人間の創造性を増幅させることです。 #AI #未来 #イノベーション」

[sendContent アクションを実行]

配信設定が完了しました！
管理画面URL: https://your-app.vercel.app/gpts/contents/abc123
こちらから配信状況を確認・編集できます。
```

## 🔧 トラブルシューティング

### よくある問題

1. **401 Unauthorized エラー**
   - APIキーが正しく設定されているか確認
   - Header名が `x-api-key` になっているか確認

2. **400 Bad Request エラー**
   - content と platform が必須項目です
   - 文字数制限を超えていないか確認

3. **スケジュールが反映されない**
   - scheduledFor の日時形式が ISO 8601 形式か確認
   - タイムゾーンの設定を確認

## 📊 API制限

- リクエスト数: 1000回/日
- 最大ペイロード: 10KB
- 同時接続数: 10

## 🔐 セキュリティ

- APIキーは定期的に更新することを推奨
- APIキーは他人と共有しない
- HTTPSでの通信のみサポート

## 📧 サポート

問題が発生した場合は、以下の情報と共にお問い合わせください：

- エラーメッセージ
- リクエストの内容
- 発生日時

---

最終更新: 2024-01-09