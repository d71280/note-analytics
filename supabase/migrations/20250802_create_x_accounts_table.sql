-- X（Twitter）連携アカウント情報を保存するテーブル
CREATE TABLE IF NOT EXISTS x_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL,
    name TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX idx_x_accounts_user_id ON x_accounts(user_id);
CREATE INDEX idx_x_accounts_username ON x_accounts(username);

-- 更新時刻を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_x_accounts_updated_at BEFORE UPDATE
    ON x_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 自動投稿設定を保存するテーブル
CREATE TABLE IF NOT EXISTS x_post_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    x_account_id UUID NOT NULL REFERENCES x_accounts(id) ON DELETE CASCADE,
    post_daily_trends BOOLEAN DEFAULT false,
    post_featured_articles BOOLEAN DEFAULT false,
    last_posted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX idx_x_post_settings_account ON x_post_settings(x_account_id);

-- 更新時刻を自動更新するトリガー
CREATE TRIGGER update_x_post_settings_updated_at BEFORE UPDATE
    ON x_post_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 投稿履歴を保存するテーブル
CREATE TABLE IF NOT EXISTS x_post_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    x_account_id UUID NOT NULL REFERENCES x_accounts(id) ON DELETE CASCADE,
    post_type TEXT NOT NULL, -- 'daily_trend', 'featured_article' など
    post_content TEXT NOT NULL,
    tweet_id TEXT,
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'success' -- 'success', 'failed'
);

-- インデックスの作成
CREATE INDEX idx_x_post_history_account ON x_post_history(x_account_id);
CREATE INDEX idx_x_post_history_posted_at ON x_post_history(posted_at);
CREATE INDEX idx_x_post_history_type ON x_post_history(post_type);