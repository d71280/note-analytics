-- ========================================
-- クイックチェック用SQL（簡易版）
-- これを最初に実行してください
-- ========================================

-- 必須テーブルの存在確認（シンプル版）
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'x_api_configs') THEN '✅'
        ELSE '❌'
    END as x_api_configs,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'x_post_history') THEN '✅'
        ELSE '❌'
    END as x_post_history,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'x_retweet_settings') THEN '✅'
        ELSE '❌'
    END as x_retweet_settings,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'knowledge_base') THEN '✅'
        ELSE '❌'
    END as knowledge_base,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'x_post_schedules') THEN '✅'
        ELSE '❌'
    END as x_post_schedules;

-- 全テーブルリスト（publicスキーマ）
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;