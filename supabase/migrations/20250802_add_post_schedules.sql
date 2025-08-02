-- 投稿スケジュール設定を保存するテーブル
CREATE TABLE IF NOT EXISTS x_post_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    schedule_type TEXT NOT NULL CHECK (schedule_type IN ('post', 'retweet')),
    enabled BOOLEAN DEFAULT true,
    time_slots TEXT[] NOT NULL, -- 投稿時間のリスト (例: ['09:00', '18:00', '21:00'])
    weekdays INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7], -- 1=月曜, 7=日曜
    timezone TEXT DEFAULT 'Asia/Tokyo',
    content_source JSONB, -- コンテンツソース設定
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 予約投稿を保存するテーブル
CREATE TABLE IF NOT EXISTS x_scheduled_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_type TEXT NOT NULL CHECK (post_type IN ('tweet', 'retweet')),
    content TEXT, -- ツイート内容（リツイートの場合はNULL）
    tweet_id TEXT, -- リツイート対象のID
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'failed', 'cancelled')),
    posted_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    ai_generated BOOLEAN DEFAULT false,
    content_source JSONB, -- コンテンツソース設定
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX idx_x_scheduled_posts_scheduled_at ON x_scheduled_posts(scheduled_at);
CREATE INDEX idx_x_scheduled_posts_status ON x_scheduled_posts(status);

-- 更新時刻を自動更新するトリガー
CREATE TRIGGER update_x_post_schedules_updated_at BEFORE UPDATE
    ON x_post_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- デフォルトのスケジュール設定を挿入
INSERT INTO x_post_schedules (schedule_type, time_slots, enabled)
VALUES 
    ('post', ARRAY['09:00', '18:00'], true),
    ('retweet', ARRAY['12:00', '21:00'], true)
ON CONFLICT DO NOTHING;