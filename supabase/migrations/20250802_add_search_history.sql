-- 検索履歴を保存するテーブル
CREATE TABLE IF NOT EXISTS x_search_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    query TEXT NOT NULL,
    results_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX idx_x_search_history_query ON x_search_history(query);
CREATE INDEX idx_x_search_history_created_at ON x_search_history(created_at);