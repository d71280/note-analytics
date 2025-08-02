# デプロイメントガイド

## Vercel へのデプロイ

### 必要な環境変数

Vercelのプロジェクト設定で以下の環境変数を設定してください：

```
# Supabase設定（必須）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# API設定
GEMINI_API_KEY=your_gemini_api_key
GROK_API_KEY=your_grok_api_key
GROK_API_URL=https://api.x.ai/v1/chat/completions

# X (Twitter) API設定
X_API_KEY=your_x_api_key
X_API_SECRET=your_x_api_secret
X_ACCESS_TOKEN=your_x_access_token
X_ACCESS_SECRET=your_x_access_secret
```

### Supabaseデータベースのセットアップ

1. Supabaseプロジェクトを作成
2. SQL Editorで`supabase/migrations/`内のファイルを以下の順序で実行：
   - `20250802_create_x_api_config_table.sql`
   - `20250802_add_retweet_tables.sql`
   - `20250802_add_search_history.sql`
   - `20250802_add_post_schedules.sql`
   - `20250802_add_knowledge_base.sql`
   - `20250802_add_grok_settings.sql`
   - `20250802_add_reply_to_id.sql`

### デプロイ手順

1. GitHubリポジトリをVercelに接続
2. 環境変数を設定
3. デプロイを実行

### トラブルシューティング

#### ビルドエラーが発生する場合
- 環境変数が正しく設定されているか確認
- Supabaseのテーブルが作成されているか確認
- Node.js 18.x以上を使用しているか確認

#### データベース接続エラーが発生する場合
- Supabase URLとAnon Keyが正しいか確認
- Supabaseプロジェクトがアクティブか確認
- Row Level Security (RLS) が適切に設定されているか確認