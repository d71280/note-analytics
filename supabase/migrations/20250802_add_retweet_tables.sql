-- リツイート履歴を保存するテーブル
CREATE TABLE IF NOT EXISTS x_retweet_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tweet_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('retweet', 'unretweet')),
    auto_retweet BOOLEAN DEFAULT false,
    search_query TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX idx_x_retweet_history_tweet_id ON x_retweet_history(tweet_id);
CREATE INDEX idx_x_retweet_history_created_at ON x_retweet_history(created_at);
CREATE INDEX idx_x_retweet_history_auto ON x_retweet_history(auto_retweet);

-- 自動リツイート設定を保存するテーブル
CREATE TABLE IF NOT EXISTS x_retweet_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    enabled BOOLEAN DEFAULT false,
    search_keywords TEXT[], -- 検索キーワード配列
    min_likes INTEGER DEFAULT 0,
    min_retweets INTEGER DEFAULT 0,
    from_users TEXT[], -- 特定ユーザーのツイートのみ
    exclude_keywords TEXT[], -- 除外キーワード
    max_retweets_per_day INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 更新時刻を自動更新するトリガー
CREATE TRIGGER update_x_retweet_settings_updated_at BEFORE UPDATE
    ON x_retweet_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- X投稿設定テーブルに自動リツイート関連のカラムを追加
ALTER TABLE x_post_settings 
ADD COLUMN IF NOT EXISTS auto_retweet_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS retweet_note_mentions BOOLEAN DEFAULT false;