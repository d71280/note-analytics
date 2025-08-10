-- scheduled_posts テーブルの作成
CREATE TABLE IF NOT EXISTS public.scheduled_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('x', 'note', 'wordpress')),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'published', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX idx_scheduled_posts_status ON public.scheduled_posts(status);
CREATE INDEX idx_scheduled_posts_platform ON public.scheduled_posts(platform);
CREATE INDEX idx_scheduled_posts_scheduled_for ON public.scheduled_posts(scheduled_for);

-- RLSポリシーの設定
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

-- 誰でも読み取り可能（開発中のため）
CREATE POLICY "Enable read access for all users" ON public.scheduled_posts
  FOR SELECT
  USING (true);

-- 誰でも挿入可能（開発中のため）
CREATE POLICY "Enable insert for all users" ON public.scheduled_posts
  FOR INSERT
  WITH CHECK (true);

-- 誰でも更新可能（開発中のため）
CREATE POLICY "Enable update for all users" ON public.scheduled_posts
  FOR UPDATE
  USING (true);

-- 誰でも削除可能（開発中のため）
CREATE POLICY "Enable delete for all users" ON public.scheduled_posts
  FOR DELETE
  USING (true);