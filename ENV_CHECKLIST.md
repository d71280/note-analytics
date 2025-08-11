# 環境設定チェックリスト

## ✅ 設定済み
- [x] Supabase URL
- [x] Supabase Anon Key  
- [x] GPTs API Key
- [x] アプリケーションURL (Vercel)

## ❌ 未設定（必要に応じて設定）

### X (Twitter) 投稿機能
- [ ] `X_API_KEY` - X Developer Portalから取得
- [ ] `X_API_SECRET` - X Developer Portalから取得
- [ ] `X_ACCESS_TOKEN` - X Developer Portalから取得
- [ ] `X_ACCESS_TOKEN_SECRET` - X Developer Portalから取得

### WordPress 投稿機能
- [ ] `WORDPRESS_SITE_URL` - WordPressサイトのURL
- [ ] `WORDPRESS_ID` - WordPressのユーザー名
- [ ] `WORDPRESS_PASSWORD` - WordPressアプリケーションパスワード

### note 投稿機能（非公式）
- [ ] `NOTE_EMAIL` - noteログインメールアドレス
- [ ] `NOTE_PASSWORD` - noteログインパスワード

### AI機能（オプション）
- [ ] `OPENAI_API_KEY` または `OPEN_AI_KEY` - OpenAI APIキー
- [ ] `GEMINI_API_KEY` - Google Gemini APIキー
- [ ] `GROK_API_KEY` - Grok APIキー（X Premium+必要）

## Vercelで設定が必要な環境変数

```bash
# 最低限必要
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GPTS_API_KEY

# X投稿用（使用する場合）
X_API_KEY
X_API_SECRET
X_ACCESS_TOKEN
X_ACCESS_TOKEN_SECRET

# WordPress投稿用（使用する場合）
WORDPRESS_SITE_URL
WORDPRESS_ID
WORDPRESS_PASSWORD

# note投稿用（使用する場合）
NOTE_EMAIL
NOTE_PASSWORD
```

## 設定方法

### Vercelダッシュボード
1. https://vercel.com/dashboard
2. プロジェクト選択
3. Settings → Environment Variables
4. 各変数を追加

### ローカル開発
`.env.local`ファイルに追加：
```bash
環境変数名=値
```

## 注意事項
- APIキーは絶対に公開しない
- `.env.local`はGitにコミットしない
- 本番環境はVercel上で管理