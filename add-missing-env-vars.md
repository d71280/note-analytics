# 🚨 重要：不足している環境変数を追加してください

## 問題
自動投稿（cron）が失敗する原因は、以下の環境変数が設定されていないためです：

1. **X_API_KEY_SECRET** - X API Key Secret
2. **X_ACCESS_TOKEN_SECRET** - X Access Token Secret

## 解決方法

### Vercel Dashboardから設定する場合：

1. https://vercel.com/dashboard にアクセス
2. プロジェクト「note-analytics-platform」を選択
3. 「Settings」タブ → 「Environment Variables」
4. 以下の環境変数を追加：

```
Name: X_API_KEY_SECRET
Value: [あなたのAPI Key Secret]
Environments: Production, Preview, Development
```

```
Name: X_ACCESS_TOKEN_SECRET  
Value: [あなたのAccess Token Secret]
Environments: Production, Preview, Development
```

### Vercel CLIから設定する場合：

```bash
vercel env add X_API_KEY_SECRET production
vercel env add X_ACCESS_TOKEN_SECRET production
```

## 値の取得方法

1. https://developer.twitter.com にアクセス
2. Developer Portalにログイン
3. 「Projects & Apps」から既存のアプリを選択
4. 「Keys and tokens」セクションから以下を確認：
   - API Key Secret（Consumer Secret）
   - Access Token Secret

## 重要な注意事項

これらの値がないと、X APIのOAuth 1.0a認証が完了せず、投稿が「Unauthorized」エラーで失敗します。

手動投稿が成功しているのは、ローカル環境の`.env.local`ファイルに値が設定されているためと思われます。

## 確認コマンド

設定後、以下で確認できます：

```bash
vercel env list | grep X_
```

すべて設定されていれば、以下の5つが表示されるはずです：
- X_API_KEY ✅
- X_API_KEY_SECRET ❌（要追加）
- X_ACCESS_TOKEN ✅  
- X_ACCESS_TOKEN_SECRET ❌（要追加）
- X_BEARER_TOKEN ✅