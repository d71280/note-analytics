# 環境変数設定手順

## 1. .env.localファイルの作成

プロジェクトルートに `.env.local` ファイルを作成し、以下の内容を追加してください：

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# GPTs連携用APIキー
GPTS_API_KEY=gpts_29b88461559e6d8fa50f0ea176414f354b497cbd4435299eaf43ae35f2666abc

# OpenAI APIキー（既存の設定があれば保持）
OPENAI_API_KEY=your_openai_api_key_here
```

## 2. Supabase設定の取得方法

1. Supabaseダッシュボードにアクセス
2. プロジェクトを選択
3. Settings → API で以下を確認：
   - Project URL
   - anon public key
   - service_role key

## 3. テーブル作成

1. Supabaseダッシュボードで「SQL Editor」を開く
2. `create_gpts_tables.sql` の内容をコピー＆ペースト
3. 「Run」ボタンをクリック

## 4. 開発サーバーの再起動

環境変数を設定後、開発サーバーを再起動してください：

```bash
npm run dev
```

## 5. APIキーの生成確認

テーブル作成後、以下のコマンドでAPIキーが正常に生成されることを確認：

```bash
curl -X POST http://localhost:3000/api/gpts/api-key
```

成功すると以下のようなレスポンスが返ります：

```json
{
  "apiKey": "gpts_...",
  "message": "APIキーを生成しました。環境変数 GPTS_API_KEY にこの値を設定してください。"
}
``` 