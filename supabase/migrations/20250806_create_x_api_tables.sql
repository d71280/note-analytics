-- X API設定テーブル
CREATE TABLE IF NOT EXISTS x_api_configs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL,
  api_key_secret TEXT NOT NULL,
  access_token TEXT NOT NULL,
  access_token_secret TEXT NOT NULL,
  bearer_token TEXT,
  username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- X投稿履歴テーブル
CREATE TABLE IF NOT EXISTS x_post_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_type TEXT NOT NULL,
  post_content TEXT NOT NULL,
  tweet_id TEXT,
  reply_to_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  posted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- X投稿設定テーブル
CREATE TABLE IF NOT EXISTS x_post_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  auto_post_enabled BOOLEAN DEFAULT false,
  post_interval_minutes INTEGER DEFAULT 60,
  max_posts_per_day INTEGER DEFAULT 17,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Xリツイート履歴テーブル
CREATE TABLE IF NOT EXISTS x_retweet_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tweet_id TEXT NOT NULL,
  original_author TEXT,
  original_content TEXT,
  retweeted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Xリツイート設定テーブル
CREATE TABLE IF NOT EXISTS x_retweet_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  search_keywords TEXT[] DEFAULT '{}',
  min_likes INTEGER DEFAULT 5,
  min_retweets INTEGER DEFAULT 1,
  retweet_note_mentions BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- X投稿スケジュールテーブル
CREATE TABLE IF NOT EXISTS x_post_schedules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_type TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  time_slots JSONB DEFAULT '[]',
  weekdays INTEGER[] DEFAULT '{1,2,3,4,5}',
  content_source JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- X予約投稿テーブル
CREATE TABLE IF NOT EXISTS x_scheduled_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending',
  platform TEXT DEFAULT 'x',
  posted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 知識ベース生成履歴テーブル
CREATE TABLE IF NOT EXISTS knowledge_generation_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT,
  generated_content TEXT NOT NULL,
  platform TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Grok API設定テーブル
CREATE TABLE IF NOT EXISTS grok_api_configs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLSポリシーの設定
ALTER TABLE x_api_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE x_post_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE x_post_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE x_retweet_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE x_retweet_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE x_post_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE x_scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_generation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE grok_api_configs ENABLE ROW LEVEL SECURITY;

-- RLSポリシーの作成
CREATE POLICY "Users can view own x_api_configs" ON x_api_configs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own x_api_configs" ON x_api_configs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own x_api_configs" ON x_api_configs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own x_api_configs" ON x_api_configs FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own x_post_history" ON x_post_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own x_post_history" ON x_post_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own x_post_settings" ON x_post_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own x_post_settings" ON x_post_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own x_post_settings" ON x_post_settings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own x_retweet_history" ON x_retweet_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own x_retweet_history" ON x_retweet_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own x_retweet_settings" ON x_retweet_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own x_retweet_settings" ON x_retweet_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own x_retweet_settings" ON x_retweet_settings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own x_post_schedules" ON x_post_schedules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own x_post_schedules" ON x_post_schedules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own x_post_schedules" ON x_post_schedules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own x_post_schedules" ON x_post_schedules FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own x_scheduled_posts" ON x_scheduled_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own x_scheduled_posts" ON x_scheduled_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own x_scheduled_posts" ON x_scheduled_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own x_scheduled_posts" ON x_scheduled_posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own knowledge_generation_history" ON knowledge_generation_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own knowledge_generation_history" ON knowledge_generation_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own grok_api_configs" ON grok_api_configs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own grok_api_configs" ON grok_api_configs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own grok_api_configs" ON grok_api_configs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own grok_api_configs" ON grok_api_configs FOR DELETE USING (auth.uid() = user_id);