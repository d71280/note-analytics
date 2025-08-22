-- scheduled_posts テーブルに display_order カラムを追加
ALTER TABLE public.scheduled_posts 
ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- display_order にインデックスを追加
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_display_order 
ON public.scheduled_posts(display_order);

-- 既存のデータに display_order を設定（作成日時順）
UPDATE public.scheduled_posts 
SET display_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM public.scheduled_posts
  WHERE display_order IS NULL
) as subquery
WHERE public.scheduled_posts.id = subquery.id;