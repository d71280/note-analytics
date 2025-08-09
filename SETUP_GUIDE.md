# Note Analytics Platform セットアップガイド

## 🚀 実装完了状況

### ✅ 実装済み機能
- GPTsからのコンテンツ受信API
- 投稿管理ダッシュボード
- X（Twitter）自動投稿機能
- スケジューリング機能
- APIキー認証システム

## 📝 必要な設定

### 1. GPTs連携設定（完了済み）
GPTsのActions設定に以下を入力：
- **認証タイプ**: API キー
- **認証タイプ（詳細）**: カスタム
- **カスタムヘッダー名**: `x-api-key`
- **APIキー**: `gpts_aacce86a2a444bb06d9f5cb0c12b9e721e56760e610c1f8455b10666a8fe8dae`

### 2. X（Twitter）API設定（要設定）

#### ステップ1: X Developer Portalでキーを取得
1. [X Developer Portal](https://developer.twitter.com/en/portal/dashboard)にアクセス
2. アプリを作成または選択
3. "Keys and tokens"タブから以下を取得：
   - API Key (Consumer Key)
   - API Secret (Consumer Secret)
   - Access Token
   - Access Token Secret

#### ステップ2: Vercelに環境変数を追加
以下の環境変数をVercelのSettingsから追加：

```
X_API_KEY=（取得したAPI Key）
X_API_SECRET=（取得したAPI Secret）
X_ACCESS_TOKEN=（取得したAccess Token）
X_ACCESS_TOKEN_SECRET=（取得したAccess Token Secret）
CRON_SECRET=cron_secret_2024_note_analytics_secure
NEXT_PUBLIC_APP_URL=https://note-analytics-platform.vercel.app
```

#### ステップ3: アプリケーションを再デプロイ
環境変数追加後、Vercelで「Redeploy」をクリック

## 🔄 動作フロー

1. **GPTsでコンテンツ生成**
   - 「X向けの投稿を作成して」などと指示

2. **アプリケーションで受信**
   - `/gpts/contents`ページに自動表示

3. **スケジュール設定**
   - 投稿日時を設定または即座に投稿

4. **自動投稿**
   - 設定した時刻にX（Twitter）へ自動投稿

## 📍 重要なページ

- **GPTs連携管理**: `/gpts/contents`
- **スケジュール投稿管理**: `/scheduled-posts`
- **スケジュール設定**: `/schedule`

## ⚠️ 注意事項

- X APIの無料プランは月1,500投稿まで
- 投稿は280文字以内
- Cronジョブは5分間隔で実行

## 🔧 トラブルシューティング

### GPTsからコンテンツが届かない場合
1. APIキーが正しく設定されているか確認
2. カスタムヘッダー名が`x-api-key`になっているか確認
3. Vercelで環境変数`GPTS_API_KEY`が設定されているか確認

### X投稿ができない場合
1. X API認証情報がすべて設定されているか確認
2. X Developer Portalでアプリの権限が「Read and Write」になっているか確認
3. APIキーを再生成して試す

## 📚 技術スタック

- Next.js 14.2.30
- Supabase（データベース）
- X API v2
- OpenAI GPTs
- Vercel（ホスティング）