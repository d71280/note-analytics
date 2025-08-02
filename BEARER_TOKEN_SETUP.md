# X API Bearer Token 設定手順

## Bearer Token の取得方法

1. **X Developer Portal にアクセス**
   - https://developer.twitter.com にログイン

2. **プロジェクトとアプリを選択**
   - Projects & Apps → 既存のプロジェクト/アプリを選択

3. **Bearer Token を取得**
   - "Keys and tokens" タブをクリック
   - "Bearer Token" セクションで "Generate" または "Regenerate" をクリック
   - 表示されたBearer Tokenをコピー（一度だけ表示されます）

## Vercel環境変数の設定

1. **Vercel Dashboard にアクセス**
   - https://vercel.com/dashboard

2. **プロジェクトの環境変数設定**
   - プロジェクトを選択
   - Settings → Environment Variables

3. **Bearer Token を追加**
   - Name: `X_BEARER_TOKEN`
   - Value: （コピーしたBearer Token）
   - Environment: All Environments

## 重要なポイント

- **Bearer Token** は X API v2 の推奨認証方式
- **Access Token + Secret** よりもセキュア
- **有効期限なし**（Access Tokenの2時間制限がない）
- **無料プランでも使用可能**

## Bearer Token の形式

正しいBearer Tokenは以下のような形式です：
```
AAAAAAAAAAAAAAAAAAAAAMLheAAAAAAA0%2BuSeid%2BULvsea4JtiGRiSDSJSI%3DEUifiRBkKG5E2XzMDjRfl76ZC9Ub0wnz4XsNiRVBChTYbJcE3F
```

このトークンを `X_BEARER_TOKEN` 環境変数に設定してください。