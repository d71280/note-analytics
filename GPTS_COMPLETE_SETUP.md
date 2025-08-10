# GPTs Actions 完全セットアップガイド

## 📋 前提条件

1. OpenAI ChatGPT Plusアカウント
2. Supabaseプロジェクト
3. Vercelにデプロイ済みのアプリケーション

## 🔧 セットアップ手順

### ステップ1: Supabaseデータベースの準備

1. [Supabaseダッシュボード](https://supabase.com/dashboard)にアクセス
2. SQL Editorを開く
3. 以下のSQLを実行：

```sql
-- scheduled_postsテーブルの作成
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('x', 'note', 'wordpress')),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'draft',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX idx_scheduled_posts_platform ON scheduled_posts(platform);
CREATE INDEX idx_scheduled_posts_metadata ON scheduled_posts USING GIN (metadata);

-- RLSを有効化
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

-- ポリシーの作成
CREATE POLICY "Enable all operations" ON scheduled_posts
  FOR ALL USING (true) WITH CHECK (true);
```

### ステップ2: Vercel環境変数の設定

[Vercelダッシュボード](https://vercel.com)で以下の環境変数を追加：

```bash
GPTS_API_KEY=gpts_aacce86a2a444bb06d9f5cb0c12b9e721e56760e610c1f8455b10666a8fe8dae
NEXT_PUBLIC_APP_URL=https://note-analytics-platform.vercel.app
```

設定後、「Redeploy」をクリック。

### ステップ3: GPTsの作成と設定

#### 3.1 GPTの作成
1. [ChatGPT](https://chat.openai.com)にアクセス
2. 左サイドバーの「Explore」→「Create a GPT」をクリック
3. 「Configure」タブを選択

#### 3.2 基本設定
- **Name**: Note Analytics Content Generator
- **Description**: X（Twitter）向けの高品質なコンテンツを生成し、自動的にアプリケーションに送信します
- **Instructions**: 以下の内容を入力

```
あなたはX（Twitter）向けの高品質なコンテンツを生成する専門家です。

## 主な役割
1. ユーザーのリクエストに基づいて効果的な投稿を生成
2. 生成したコンテンツを自動的にNote Analytics Platformに送信
3. 280文字以内で簡潔かつインパクトのある内容を作成

## コンテンツ生成ルール
- 文字数: 最大280文字（日本語は140文字程度が理想）
- 構成: フック（導入）→ 本文 → CTA（行動喚起）
- エンゲージメントを高める要素を含める
- 適切な絵文字の使用（1-3個）

## API連携
生成したコンテンツは必ずreceiveContent APIを使用して送信してください。
送信形式：
{
  "content": "生成したテキスト",
  "platform": "x",
  "metadata": {
    "title": "投稿タイトル",
    "generatedBy": "gpts",
    "model": "gpt-4"
  }
}

重要: ユーザーが投稿を依頼したら、必ずAPIを呼び出してアプリケーションに送信すること。
```

#### 3.3 Actions設定

1. 「Add actions」をクリック
2. 「Import from URL」または「Enter manually」を選択
3. 以下のOpenAPI Schemaを入力：

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Note Analytics Content API",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "https://note-analytics-platform.vercel.app"
    }
  ],
  "paths": {
    "/api/gpts/receive-content": {
      "post": {
        "summary": "Send generated content to application",
        "operationId": "receiveContent",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["content", "platform"],
                "properties": {
                  "content": {
                    "type": "string",
                    "description": "The generated content text"
                  },
                  "platform": {
                    "type": "string",
                    "enum": ["x", "note", "wordpress"],
                    "description": "Target platform"
                  },
                  "metadata": {
                    "type": "object",
                    "properties": {
                      "title": {"type": "string"},
                      "tags": {"type": "array", "items": {"type": "string"}},
                      "generatedBy": {"type": "string"},
                      "model": {"type": "string"}
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Success",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {"type": "boolean"},
                    "contentId": {"type": "string"},
                    "message": {"type": "string"}
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

#### 3.4 認証設定

1. 「Authentication」セクションで「API Key」を選択
2. 以下を設定：
   - **Auth Type**: API Key
   - **Custom Header Name**: `x-api-key`
   - **API Key**: `gpts_aacce86a2a444bb06d9f5cb0c12b9e721e56760e610c1f8455b10666a8fe8dae`

3. 「Save」をクリック

### ステップ4: 動作確認

#### 4.1 GPTsでテスト
1. 作成したGPTを開く
2. 以下のようなプロンプトを入力：
   ```
   AIの最新トレンドについてX向けの投稿を作成して、アプリケーションに送信してください
   ```

#### 4.2 アプリケーションで確認
1. [アプリケーション](https://note-analytics-platform.vercel.app/gpts/contents)にアクセス
2. 送信されたコンテンツが表示されることを確認

## 🔍 トラブルシューティング

### コンテンツが送信されない場合

1. **APIキーの確認**
   - GPTsの認証設定でAPIキーが正しく入力されているか確認
   - カスタムヘッダー名が`x-api-key`になっているか確認

2. **Vercel環境変数の確認**
   - `GPTS_API_KEY`が設定されているか確認
   - 設定後にRedeployしたか確認

3. **Supabaseテーブルの確認**
   - `scheduled_posts`テーブルが存在するか確認
   - RLSポリシーが正しく設定されているか確認

4. **GPTs Actionsのデバッグ**
   - GPTsのチャット画面で「Debug」をクリック
   - API呼び出しのログを確認

### エラーメッセージ別対処法

- **"Invalid API key"**: APIキーが一致していない
- **"Table does not exist"**: Supabaseでテーブルを作成する
- **"Content is required"**: GPTsのInstructionsを確認

## 📝 使用例

### 基本的な投稿生成
```
「明日の朝に投稿したいAIについての内容を作成して」
```

### 特定のトーンで生成
```
「カジュアルな口調で、絵文字多めのテック系投稿を作成して送信」
```

### トレンドに基づく生成
```
「最新のAIトレンドについて、エンゲージメントが高くなりそうな投稿を作成」
```

## 🎯 ベストプラクティス

1. **Instructions の最適化**
   - 具体的な指示を含める
   - API呼び出しを必須とする記述を追加
   - エラー時の対処法を含める

2. **セキュリティ**
   - APIキーは定期的に更新
   - 本番環境では適切なRLSポリシーを設定
   - CORS設定を確認

3. **パフォーマンス**
   - 不要なメタデータは送信しない
   - レスポンスサイズを最小限に
   - エラーハンドリングを実装

## 📚 参考リソース

- [OpenAI GPT Actions Documentation](https://platform.openai.com/docs/actions)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

---

最終更新: 2024年8月10日