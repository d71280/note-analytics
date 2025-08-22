# X (Twitter) API 認証情報の設定

スケジュール投稿が動作するためには、Vercelに以下の環境変数を設定する必要があります。

## 必要な環境変数

1. **X_API_KEY** - X API Key
2. **X_API_KEY_SECRET** - X API Key Secret
3. **X_ACCESS_TOKEN** - X Access Token
4. **X_ACCESS_TOKEN_SECRET** - X Access Token Secret
5. **X_BEARER_TOKEN** - X Bearer Token（オプション）

## 設定方法

### 方法1: Vercel Dashboard から設定

1. https://vercel.com/dashboard にアクセス
2. プロジェクトを選択
3. 「Settings」タブ → 「Environment Variables」
4. 各環境変数を追加:
   - Key: X_API_KEY
   - Value: [あなたのAPI Key]
   - Environment: Production, Preview, Development
5. 「Save」をクリック

### 方法2: Vercel CLI から設定

```bash
vercel env add X_API_KEY production
vercel env add X_API_KEY_SECRET production
vercel env add X_ACCESS_TOKEN production
vercel env add X_ACCESS_TOKEN_SECRET production
vercel env add X_BEARER_TOKEN production
```

## X API 認証情報の取得方法

1. https://developer.twitter.com にアクセス
2. Developer Portal にログイン
3. 「Projects & Apps」から既存のアプリを選択、または新規作成
4. 「Keys and tokens」セクションから各種キーを取得
5. Access TokenとAccess Token Secretは「Generate」ボタンで生成

## 重要な注意事項

- **User authentication settings** で「Read and write」権限を有効にする
- **App permissions** を「Read and write」に設定
- Access TokenとSecretを再生成した場合は、古いものは無効になる

## テスト方法

環境変数設定後、以下のコマンドでテスト：

```bash
node test-schedule-post.js
```

これで、スケジュール投稿が予定時刻に自動的にX (Twitter)に投稿されます。