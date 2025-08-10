-- Supabase SQL Editor で実行してください
-- このSQLはscheduled_postsテーブルを作成します

-- 既存のテーブルを削除（必要な場合のみ）
-- DROP TABLE IF EXISTS scheduled_posts CASCADE;

-- scheduled_postsテーブルの作成
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('x', 'note', 'wordpress')),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'scheduled', 'posted', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_platform ON scheduled_posts(platform);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_for ON scheduled_posts(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_metadata ON scheduled_posts USING GIN (metadata);

-- RLS (Row Level Security) を有効化
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

-- 全ユーザーに読み書き権限を付与（本番環境では適切に制限してください）
CREATE POLICY "Enable all operations for all users" ON scheduled_posts
  FOR ALL USING (true) WITH CHECK (true);

-- テーブルが正しく作成されたか確認
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM 
  information_schema.columns
WHERE 
  table_name = 'scheduled_posts'
ORDER BY 
  ordinal_position;