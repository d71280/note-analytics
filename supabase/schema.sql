-- ユーザーテーブル（Supabase Authと連携）
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  note_username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- カテゴリーマスタ
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- クリエイター情報
CREATE TABLE creators (
  id SERIAL PRIMARY KEY,
  note_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  total_articles INTEGER DEFAULT 0,
  category_id INTEGER REFERENCES categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- クリエイター統計
CREATE TABLE creator_metrics (
  id SERIAL PRIMARY KEY,
  creator_id INTEGER REFERENCES creators(id),
  date DATE NOT NULL,
  follower_count INTEGER,
  total_likes INTEGER,
  total_articles INTEGER,
  engagement_rate DECIMAL(5,2),
  growth_rate DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(creator_id, date)
);

-- 記事情報
CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  creator_id INTEGER REFERENCES creators(id),
  note_article_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  excerpt TEXT,
  thumbnail_url TEXT,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  tags TEXT[],
  reading_time INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 記事統計
CREATE TABLE article_metrics (
  id SERIAL PRIMARY KEY,
  article_id INTEGER REFERENCES articles(id),
  date DATE NOT NULL,
  like_count INTEGER,
  comment_count INTEGER,
  view_count INTEGER,
  like_velocity DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, date)
);

-- 分析履歴
CREATE TABLE analysis_history (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  follower_count INTEGER,
  category_id INTEGER REFERENCES categories(id),
  overall_score INTEGER,
  title_score INTEGER,
  content_score INTEGER,
  seo_score INTEGER,
  readability_score INTEGER,
  predicted_likes INTEGER,
  engagement_rate DECIMAL(5,2),
  viral_potential TEXT,
  suggestions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ユーザーのお気に入りクリエイター
CREATE TABLE favorite_creators (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  creator_id INTEGER REFERENCES creators(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, creator_id)
);

-- トレンド記事
CREATE TABLE trending_articles (
  id SERIAL PRIMARY KEY,
  article_id INTEGER REFERENCES articles(id),
  category_id INTEGER REFERENCES categories(id),
  trending_score DECIMAL(10,2),
  trending_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(article_id, trending_date)
);

-- Row Level Security (RLS) ポリシー
-- ユーザーは自分のデータのみ更新可能
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 分析履歴は本人のみ閲覧可能
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analysis" ON analysis_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analysis" ON analysis_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- クリエイター情報は全員閲覧可能
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view creators" ON creators
  FOR SELECT USING (true);

-- 記事情報は全員閲覧可能
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view articles" ON articles
  FOR SELECT USING (true);

-- パフォーマンス最適化のためのインデックス
CREATE INDEX idx_creators_category ON creators(category_id);
CREATE INDEX idx_creators_follower_count ON creators(follower_count DESC);
CREATE INDEX idx_articles_creator ON articles(creator_id);
CREATE INDEX idx_articles_published ON articles(published_at DESC);
CREATE INDEX idx_articles_likes ON articles(like_count DESC);
CREATE INDEX idx_article_metrics_date ON article_metrics(date DESC);
CREATE INDEX idx_trending_articles_date ON trending_articles(trending_date DESC);

-- カテゴリーの初期データ
INSERT INTO categories (name, slug, icon, color) VALUES
  ('ビジネス', 'business', 'briefcase', '#3B82F6'),
  ('テクノロジー', 'technology', 'cpu', '#8B5CF6'),
  ('ライフスタイル', 'lifestyle', 'heart', '#EC4899'),
  ('エンタメ', 'entertainment', 'film', '#F59E0B'),
  ('クリエイティブ', 'creative', 'palette', '#10B981'),
  ('教育', 'education', 'book', '#6366F1'),
  ('スポーツ', 'sports', 'activity', '#EF4444'),
  ('その他', 'other', 'grid', '#6B7280');