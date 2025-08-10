-- GPTs連携用テーブル作成スクリプト
-- Supabase SQL Editor で実行してください

-- settingsテーブルの作成（APIキー保存用）
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- scheduled_postsテーブルの作成（投稿管理用）
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
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 全ユーザーに読み書き権限を付与（本番環境では適切に制限してください）
CREATE POLICY "Enable all operations for all users" ON scheduled_posts
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for all users" ON settings
  FOR ALL USING (true) WITH CHECK (true);

-- updated_atカラムの自動更新トリガーを作成
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガーを作成
CREATE TRIGGER update_scheduled_posts_updated_at 
    BEFORE UPDATE ON scheduled_posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at 
    BEFORE UPDATE ON settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- テーブルが正しく作成されたか確認
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM 
  information_schema.columns
WHERE 
  table_name IN ('scheduled_posts', 'settings')
ORDER BY 
  table_name, ordinal_position; 