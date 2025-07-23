# Note Analytics Platform - 環境設定ガイド

## 🔧 必要な環境変数

### 必須環境変数
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📝 ローカル開発設定

### 1. Supabase設定値の取得
1. [Supabase Dashboard](https://supabase.com/dashboard)にアクセス
2. プロジェクトを選択
3. **Settings** → **API** へ移動
4. 以下をコピー：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API Key (anon, public)** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. .env.localの更新
プロジェクトルートの`.env.local`ファイルを編集：

```bash
# 実際の値に置き換えてください
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. 環境変数の確認
```bash
npm run dev
```
で開発サーバーを起動して動作確認

## 🚀 Vercel環境設定

### Vercelダッシュボードで設定

1. **Vercelダッシュボード**にアクセス
2. プロジェクトを選択
3. **Settings** → **Environment Variables** へ移動
4. 以下の環境変数を追加：

| 変数名 | 値 | 環境 |
|--------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiI...` | Production, Preview, Development |

### Vercel CLI経由での設定

```bash
# Vercel CLIインストール
npm install -g vercel

# プロジェクトにログイン
vercel login

# 環境変数の設定
vercel env add NEXT_PUBLIC_SUPABASE_URL
# 値を入力: https://your-project.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY  
# 値を入力: eyJhbGciOiJIUzI1NiI...

# 再デプロイ
vercel --prod
```

## 🔍 Note API設定

Note APIは認証不要なので、追加の環境変数は必要ありません。
ただし、将来的にAPIキーが必要になった場合：

```bash
# 将来用（現在は不要）
NOTE_API_KEY=your_note_api_key_if_needed
```

## ✅ 動作確認

### ローカル環境
```bash
# 開発サーバー起動
npm run dev

# ブラウザで確認
# http://localhost:3000
```

### 本番環境
```bash
# Vercelでのデプロイ
vercel --prod

# または、GitHubプッシュで自動デプロイ
git push origin main
```

## 🐛 トラブルシューティング

### よくあるエラー

#### 1. "createClient is not a function"
```bash
# 環境変数が設定されていない
# .env.localを確認してください
```

#### 2. "Invalid API URL"
```bash
# NEXT_PUBLIC_SUPABASE_URLが正しくない
# Supabaseダッシュボードで再確認
```

#### 3. "Invalid API key"
```bash
# NEXT_PUBLIC_SUPABASE_ANON_KEYが正しくない
# "anon" keyを使用していることを確認
```

### デバッグ方法

#### 環境変数の確認
```bash
# ローカル環境での確認
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

#### ブラウザコンソールでの確認
```javascript
// ブラウザの開発者ツールで実行
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
```

## 📋 チェックリスト

### ローカル開発
- [ ] Supabase設定値を取得
- [ ] .env.localファイルを作成・更新
- [ ] npm run devで動作確認
- [ ] データベース接続確認

### Vercel本番環境
- [ ] Vercel環境変数を設定
- [ ] GitHubと連携設定
- [ ] 自動デプロイの確認
- [ ] 本番環境での動作確認

## 🔐 セキュリティ注意事項

1. **.env.localをGitにコミットしない**
   - `.gitignore`で除外済み
   
2. **anon keyのみを使用**
   - service_role keyは絶対に公開しない
   
3. **環境変数の管理**
   - 本番とテスト環境で異なる値を使用
   - 定期的なキーのローテーション

## 🚀 Note API機能

実装済みのNote API機能：
- ✅ 記事データ取得
- ✅ ユーザー情報取得  
- ✅ 検索機能
- ✅ エンゲージメント分析
- ✅ レート制限管理
- ✅ エラーハンドリング

これらの機能は環境変数設定後、すぐに利用可能です。 