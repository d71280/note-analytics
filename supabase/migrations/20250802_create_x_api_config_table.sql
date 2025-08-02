-- 既存のテーブルを削除（もし存在する場合）
DROP TABLE IF EXISTS x_post_history CASCADE;
DROP TABLE IF EXISTS x_post_settings CASCADE;
DROP TABLE IF EXISTS x_accounts CASCADE;

-- X API設定を保存するテーブル
CREATE TABLE IF NOT EXISTS x_api_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    api_key TEXT NOT NULL,
    api_secret TEXT NOT NULL,
    access_token TEXT NOT NULL,
    access_token_secret TEXT NOT NULL,
    username TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 更新時刻を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_x_api_configs_updated_at BEFORE UPDATE
    ON x_api_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 自動投稿設定を保存するテーブル
CREATE TABLE IF NOT EXISTS x_post_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_daily_trends BOOLEAN DEFAULT false,
    post_featured_articles BOOLEAN DEFAULT false,
    last_posted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 更新時刻を自動更新するトリガー
CREATE TRIGGER update_x_post_settings_updated_at BEFORE UPDATE
    ON x_post_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 投稿履歴を保存するテーブル
CREATE TABLE IF NOT EXISTS x_post_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_type TEXT NOT NULL, -- 'daily_trend', 'featured_article', 'manual' など
    post_content TEXT NOT NULL,
    tweet_id TEXT,
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'success' -- 'success', 'failed'
);

-- インデックスの作成
CREATE INDEX idx_x_post_history_posted_at ON x_post_history(posted_at);
CREATE INDEX idx_x_post_history_type ON x_post_history(post_type);