# X API 設定ガイド

## 重要：ツイート投稿にはOAuth 1.0a認証が必須

X API v2のツイート投稿エンドポイント（`/2/tweets`）は**ユーザーコンテキスト**が必要です。
Bearer Tokenは読み取り専用で、ツイート投稿には使用できません。

## 必要な環境変数（ツイート投稿用）

以下の4つすべてが必要です：

```
X_API_KEY=あなたのAPIキー
X_API_SECRET=あなたのAPIシークレット（またはX_API_KEY_SECRET）
X_ACCESS_TOKEN=あなたのアクセストークン
X_ACCESS_SECRET=あなたのアクセストークンシークレット
```

## X Developer Portalでの設定手順

### 1. アプリの権限設定を確認

1. [X Developer Portal](https://developer.twitter.com)にログイン
2. あなたのアプリを選択
3. "User authentication settings"をクリック
4. 以下を確認：
   - **App permissions**: "Read and write"が選択されている
   - OAuth 1.0aが有効になっている

### 2. APIキーとシークレットを取得

1. "Keys and tokens"タブに移動
2. **Consumer Keys**セクション：
   - API Key（X_API_KEY）
   - API Secret（X_API_SECRET）

### 3. アクセストークンを生成（重要）

1. "Keys and tokens"タブ
2. **Authentication Tokens**セクション
3. "Access Token and Secret"の"Generate"または"Regenerate"をクリック
4. 以下をコピー：
   - Access Token（X_ACCESS_TOKEN）
   - Access Token Secret（X_ACCESS_SECRET）

⚠️ **注意事項**：
- 無料プランではアクセストークンは**2時間で期限切れ**になります
- 403エラーが出た場合は、トークンを再生成してください
- 生成時に"Read and write"権限があることを確認

## Vercelでの環境変数設定

1. Vercelダッシュボードにログイン
2. プロジェクトを選択
3. Settings → Environment Variables
4. 以下を追加：

```
X_API_KEY=（あなたのAPIキー）
X_API_SECRET=（あなたのAPIシークレット）
X_ACCESS_TOKEN=（あなたのアクセストークン）
X_ACCESS_SECRET=（あなたのアクセストークンシークレット）
```

5. すべての環境（Production, Preview, Development）に適用
6. デプロイを再実行

## エラー対処法

### 403 Forbidden エラー
- **原因**: アクセストークンの期限切れ（2時間）
- **解決**: X Developer Portalで新しいアクセストークンを生成

### 401 Unauthorized エラー
- **原因**: 認証情報が正しくない
- **解決**: 環境変数をすべて確認

### "Authenticating with OAuth 2.0 Application-Only is forbidden"
- **原因**: Bearer Tokenを使用している
- **解決**: OAuth 1.0aの4つの環境変数をすべて設定

## Bearer Token（X_BEARER_TOKEN）について

Bearer Tokenは以下の用途でのみ使用可能：
- ツイート検索
- ユーザー情報の取得
- タイムラインの読み取り

**ツイート投稿には使用できません**

## 月間制限

無料プラン（Basic）:
- 1,500ツイート/月
- アプリレート制限: 50リクエスト/15分

制限に達した場合は翌月まで待つか、プランをアップグレードしてください。