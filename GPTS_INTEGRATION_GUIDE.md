# GPTs連携機能 使用ガイド

## 📋 概要
このドキュメントでは、GPTs連携機能の使い方とVercel本番環境での動作確認方法を説明します。

## 🚀 機能一覧

### 1. GPTsからのコンテンツ受信
- **エンドポイント**: `/api/gpts/universal`
- **メソッド**: GET
- **パラメータ**:
  - `action=save`: 保存アクション
  - `content`: 投稿内容（URLエンコード必須）
  - `platform`: プラットフォーム（x, note, wordpress）

**例**:
```
https://note-analytics.vercel.app/api/gpts/universal?action=save&content=テスト投稿&platform=x
```

### 2. GPTsコンテンツ一覧取得
- **エンドポイント**: `/api/gpts/contents`
- **メソッド**: GET
- **パラメータ** (オプション):
  - `platform`: フィルター（all, x, note, wordpress）
  - `status`: ステータスフィルター（all, draft, pending）

### 3. スケジュール設定
- **エンドポイント**: `/api/gpts/contents/{id}/schedule`
- **メソッド**: PUT
- **ボディ**:
```json
{
  "scheduled_for": "2025-08-22T09:00:00Z",
  "status": "pending"
}
```

### 4. スケジュール解除
- **エンドポイント**: `/api/gpts/contents/{id}/schedule`
- **メソッド**: PUT
- **ボディ**:
```json
{
  "scheduled_for": null,
  "status": "draft"
}
```

### 5. コンテンツ削除
- **エンドポイント**: `/api/gpts/contents/{id}`
- **メソッド**: DELETE

## 🧪 テスト手順

### ステップ1: テストページを開く
1. `test-vercel-production.html`をブラウザで開く
2. 自動的にVercel本番環境に接続されます

### ステップ2: テストデータ作成
1. 「テストデータ作成」ボタンをクリック
2. 3つのテストコンテンツが自動作成されます

### ステップ3: スケジュール設定テスト
1. 各コンテンツの日時入力欄で日時を選択
2. 「スケジュール設定」ボタンをクリック
3. ステータスが「pending」に変わることを確認

### ステップ4: スケジュール解除テスト
1. スケジュール済みのコンテンツで「スケジュール解除」をクリック
2. ステータスが「draft」に戻ることを確認

### ステップ5: 削除テスト
1. 「削除」ボタンをクリック
2. 確認ダイアログで「OK」を選択
3. コンテンツが一覧から消えることを確認

## 🌐 本番環境URL
- **アプリケーション**: https://note-analytics.vercel.app
- **GPTs連携ページ**: https://note-analytics.vercel.app/schedule/gpts

## ⚠️ 注意事項
1. すべてのAPIはCORS対応済み
2. 認証なしでアクセス可能（テスト環境）
3. URLパラメータは必ずURLエンコードすること
4. 日本語コンテンツの場合は特に注意

## 🔧 トラブルシューティング

### 405エラーが発生する場合
- Vercelの再デプロイを実行
- ビルドキャッシュをクリア

### コンテンツが表示されない場合
- フィルター設定を「すべて」に変更
- ブラウザのキャッシュをクリア

### スケジュール設定が失敗する場合
- 日時形式が正しいか確認（ISO 8601形式）
- タイムゾーンの設定を確認

## 📝 動作確認チェックリスト
- [ ] GPTsからコンテンツを受信できる
- [ ] コンテンツ一覧が表示される
- [ ] スケジュール設定ができる
- [ ] スケジュール解除ができる
- [ ] コンテンツを削除できる
- [ ] フィルター機能が動作する
- [ ] ステータスが正しく更新される

## 🚦 ステータス説明
- **draft**: 下書き（未スケジュール）
- **pending**: スケジュール済み（投稿待ち）
- **published**: 公開済み

## 📊 データベース構造
```
scheduled_posts
├── id (UUID)
├── content (テキスト)
├── platform (x/note/wordpress)
├── status (draft/pending/published)
├── scheduled_for (タイムスタンプ)
├── metadata (JSON)
│   ├── source (gpts-universal等)
│   ├── model (使用したAIモデル)
│   └── receivedAt (受信日時)
├── created_at
└── updated_at
```

---

作成日: 2025-08-21
最終更新: 2025-08-21