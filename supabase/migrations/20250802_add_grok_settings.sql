-- Grok API設定を保存するテーブル
CREATE TABLE IF NOT EXISTS grok_api_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    api_key TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 更新時刻を自動更新するトリガー
CREATE TRIGGER update_grok_api_configs_updated_at BEFORE UPDATE
    ON grok_api_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- X投稿設定テーブルにAI生成関連のカラムを追加
ALTER TABLE x_post_settings 
ADD COLUMN IF NOT EXISTS use_ai_generation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS prefer_grok BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS ai_generation_style TEXT DEFAULT 'professional';