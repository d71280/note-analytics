-- ========================================
-- テーブル存在確認
-- ========================================

-- 1. 現在存在するテーブルの一覧
SELECT 
    tablename as "テーブル名",
    '✅ 存在' as "状態"
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. 必須テーブルの存在チェック（個別に確認）
SELECT 
    'x_api_configs' as table_name,
    EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'x_api_configs') as exists
UNION ALL
SELECT 
    'x_post_history',
    EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'x_post_history')
UNION ALL
SELECT 
    'x_post_settings',
    EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'x_post_settings')
UNION ALL
SELECT 
    'x_retweet_history',
    EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'x_retweet_history')
UNION ALL
SELECT 
    'x_retweet_settings',
    EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'x_retweet_settings')
UNION ALL
SELECT 
    'x_search_history',
    EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'x_search_history')
UNION ALL
SELECT 
    'x_post_schedules',
    EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'x_post_schedules')
UNION ALL
SELECT 
    'x_scheduled_posts',
    EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'x_scheduled_posts')
UNION ALL
SELECT 
    'knowledge_base',
    EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'knowledge_base')
UNION ALL
SELECT 
    'knowledge_chunks',
    EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'knowledge_chunks')
UNION ALL
SELECT 
    'knowledge_generation_history',
    EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'knowledge_generation_history')
UNION ALL
SELECT 
    'grok_api_configs',
    EXISTS(SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'grok_api_configs')
ORDER BY table_name;