# Supabase SQLコマンド - スケジュール投稿の削除

## 1. RLSポリシーの確認と無効化

### 現在のRLSポリシーを確認
```sql
-- tweet_queueテーブルのRLSポリシーを確認
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'tweet_queue';
```

### RLSを一時的に無効化（推奨）
```sql
-- RLSを無効化
ALTER TABLE tweet_queue DISABLE ROW LEVEL SECURITY;
```

### RLSを再度有効化する場合
```sql
-- RLSを有効化
ALTER TABLE tweet_queue ENABLE ROW LEVEL SECURITY;
```

## 2. 全投稿を削除

### すべての投稿を削除
```sql
-- tweet_queueテーブルのすべてのレコードを削除
DELETE FROM tweet_queue;
```

### 条件付き削除
```sql
-- 特定のステータスの投稿のみ削除
DELETE FROM tweet_queue WHERE status = 'pending';

-- 特定の日付より古い投稿を削除
DELETE FROM tweet_queue WHERE created_at < NOW() - INTERVAL '7 days';

-- 特定のユーザーの投稿を削除
DELETE FROM tweet_queue WHERE user_id = 'specific-user-id';
```

## 3. テーブル構造の確認

### テーブルの列を確認
```sql
-- tweet_queueテーブルの構造を確認
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'tweet_queue'
ORDER BY ordinal_position;
```

### レコード数を確認
```sql
-- 現在のレコード数を確認
SELECT COUNT(*) FROM tweet_queue;

-- ステータス別のレコード数を確認
SELECT status, COUNT(*) 
FROM tweet_queue 
GROUP BY status;
```

## 4. RLSポリシーの削除と再作成

### 既存のポリシーをすべて削除
```sql
-- tweet_queueのすべてのポリシーを削除
DROP POLICY IF EXISTS "Enable all for authenticated users" ON tweet_queue;
DROP POLICY IF EXISTS "Enable read for all users" ON tweet_queue;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON tweet_queue;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON tweet_queue;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON tweet_queue;
```

### 新しいポリシーを作成（完全アクセス）
```sql
-- すべての操作を許可するポリシーを作成
CREATE POLICY "Allow all operations" ON tweet_queue
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

## 5. Function（関数）を作成して削除

### 削除用の関数を作成
```sql
-- 強制削除用の関数を作成
CREATE OR REPLACE FUNCTION delete_all_tweet_queue()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM tweet_queue;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 関数に実行権限を付与
GRANT EXECUTE ON FUNCTION delete_all_tweet_queue() TO anon, authenticated;
```

### 関数を使用して削除
```sql
-- 関数を実行
SELECT delete_all_tweet_queue();
```

## 実行手順

1. **Supabaseダッシュボード**にログイン
2. **SQL Editor**タブを開く
3. 上記のSQLコマンドを順番に実行

### 推奨される手順：

1. まず現在のRLSポリシーを確認
2. RLSを無効化
3. `DELETE FROM tweet_queue;` で全削除
4. 必要に応じてRLSを再度有効化

## 注意事項

- RLSを無効化すると、すべてのユーザーがデータにアクセス可能になります
- 本番環境では慎重に実行してください
- 削除したデータは復元できません