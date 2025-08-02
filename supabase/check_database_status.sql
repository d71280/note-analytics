-- ========================================
-- データベース状態確認用SQL
-- Supabase SQL Editorで実行してください
-- ========================================

-- 1. 必要なテーブルの存在確認
-- ----------------------------------------
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN tablename IN (
            'x_api_configs',
            'x_post_history',
            'x_post_settings',
            'x_retweet_history',
            'x_retweet_settings',
            'x_search_history',
            'x_post_schedules',
            'x_scheduled_posts',
            'knowledge_base',
            'knowledge_chunks',
            'knowledge_generation_history',
            'grok_api_configs'
        ) THEN '✅ 必須テーブル'
        ELSE '📋 その他'
    END as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY 
    CASE 
        WHEN tablename IN (
            'x_api_configs',
            'x_post_history',
            'x_post_settings',
            'x_retweet_history',
            'x_retweet_settings',
            'x_search_history',
            'x_post_schedules',
            'x_scheduled_posts',
            'knowledge_base',
            'knowledge_chunks',
            'knowledge_generation_history',
            'grok_api_configs'
        ) THEN 0
        ELSE 1
    END,
    tablename;

-- 2. 各テーブルの行数確認
-- ----------------------------------------
DO $$
DECLARE
    tbl_name text;
    row_count integer;
BEGIN
    RAISE NOTICE '=== テーブル行数 ===';
    
    FOR tbl_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'x_api_configs',
            'x_post_history',
            'x_post_settings',
            'x_retweet_history',
            'x_retweet_settings',
            'x_search_history',
            'x_post_schedules',
            'x_scheduled_posts',
            'knowledge_base',
            'knowledge_chunks',
            'knowledge_generation_history',
            'grok_api_configs'
        )
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', tbl_name) INTO row_count;
        RAISE NOTICE '% : % 行', tbl_name, row_count;
    END LOOP;
END $$;

-- 3. RLS (Row Level Security) の状態確認
-- ----------------------------------------
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity THEN '🔒 RLS有効'
        ELSE '🔓 RLS無効'
    END as rls_status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
AND t.tablename IN (
    'x_api_configs',
    'x_post_history',
    'x_post_settings',
    'x_retweet_history',
    'x_retweet_settings',
    'x_search_history',
    'x_post_schedules',
    'x_scheduled_posts',
    'knowledge_base',
    'knowledge_chunks',
    'knowledge_generation_history',
    'grok_api_configs'
)
ORDER BY tablename;

-- 4. 不足しているテーブルのリスト
-- ----------------------------------------
WITH required_tables AS (
    SELECT unnest(ARRAY[
        'x_api_configs',
        'x_post_history',
        'x_post_settings',
        'x_retweet_history',
        'x_retweet_settings',
        'x_search_history',
        'x_post_schedules',
        'x_scheduled_posts',
        'knowledge_base',
        'knowledge_chunks',
        'knowledge_generation_history',
        'grok_api_configs'
    ]) as table_name
),
existing_tables AS (
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
)
SELECT 
    rt.table_name as "不足しているテーブル",
    CASE rt.table_name
        WHEN 'x_api_configs' THEN '20250802_create_x_api_config_table.sql'
        WHEN 'x_post_history' THEN '20250802_create_x_api_config_table.sql'
        WHEN 'x_post_settings' THEN '20250802_create_x_api_config_table.sql'
        WHEN 'x_retweet_history' THEN '20250802_add_retweet_tables.sql'
        WHEN 'x_retweet_settings' THEN '20250802_add_retweet_tables.sql'
        WHEN 'x_search_history' THEN '20250802_add_search_history.sql'
        WHEN 'x_post_schedules' THEN '20250802_add_post_schedules.sql'
        WHEN 'x_scheduled_posts' THEN '20250802_add_post_schedules.sql'
        WHEN 'knowledge_base' THEN '20250802_add_knowledge_base.sql'
        WHEN 'knowledge_chunks' THEN '20250802_add_knowledge_base.sql'
        WHEN 'knowledge_generation_history' THEN '20250802_add_knowledge_base.sql'
        WHEN 'grok_api_configs' THEN '20250802_add_grok_settings.sql'
    END as "実行が必要なマイグレーションファイル"
FROM required_tables rt
LEFT JOIN existing_tables et ON rt.table_name = et.tablename
WHERE et.tablename IS NULL;

-- 5. テーブルのカラム情報確認（例: x_post_history）
-- ----------------------------------------
SELECT 
    column_name as "カラム名",
    data_type as "データ型",
    is_nullable as "NULL許可",
    column_default as "デフォルト値"
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'x_post_history'
ORDER BY ordinal_position;

-- 6. インデックスの確認
-- ----------------------------------------
SELECT 
    tablename as "テーブル名",
    indexname as "インデックス名",
    indexdef as "インデックス定義"
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
    'x_api_configs',
    'x_post_history',
    'x_post_settings',
    'x_retweet_history',
    'x_retweet_settings',
    'x_search_history',
    'x_post_schedules',
    'x_scheduled_posts',
    'knowledge_base',
    'knowledge_chunks',
    'knowledge_generation_history',
    'grok_api_configs'
)
ORDER BY tablename, indexname;

-- 7. 拡張機能の確認（pgvectorなど）
-- ----------------------------------------
SELECT 
    extname as "拡張機能名",
    extversion as "バージョン"
FROM pg_extension
WHERE extname IN ('vector', 'uuid-ossp', 'pgcrypto')
ORDER BY extname;