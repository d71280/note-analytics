# Vercel環境変数設定ガイド

## OpenAI APIキーの設定方法

1. Vercelダッシュボードにログイン
2. プロジェクトを選択
3. "Settings" タブをクリック
4. 左側メニューから "Environment Variables" を選択
5. 以下の環境変数を追加：

### 必須環境変数

```
OPENAI_API_KEY = your-openai-api-key-here
```

**重要**: 実際のAPIキーは.env.localファイルを参照するか、OpenAIダッシュボードから取得してください。

### 設定手順

1. "Add New" ボタンをクリック
2. Key: `OPENAI_API_KEY`
3. Value: 上記のAPIキー全体をコピー&ペースト
4. Environment: Production, Preview, Development すべてにチェック
5. "Save" をクリック

### 確認方法

設定後、以下のURLにアクセスして確認：
- `/api/check-env` - 環境変数の設定状況
- `/api/test-openai` - OpenAI APIの接続テスト

### トラブルシューティング

1. **環境変数が反映されない場合**
   - Vercelで再デプロイが必要
   - Settings > Git > Redeploy

2. **APIキーが無効な場合**
   - OpenAIダッシュボードで新しいキーを生成
   - 使用制限やクレジット残高を確認

3. **デバッグ方法**
   - Vercel Functions ログを確認
   - Project > Functions タブ