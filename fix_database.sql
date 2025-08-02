-- トリガー関数を作成
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- knowledge_baseテーブルにupdated_atカラムがない場合は追加
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'knowledge_base' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE knowledge_base ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- トリガーを作成
DROP TRIGGER IF EXISTS update_knowledge_base_updated_at ON knowledge_base;
CREATE TRIGGER update_knowledge_base_updated_at
    BEFORE UPDATE ON knowledge_base
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- x_search_historyテーブルにもupdated_atカラムを追加（必要な場合）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'x_search_history' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE x_search_history ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- x_search_historyテーブルにもトリガーを作成
DROP TRIGGER IF EXISTS update_x_search_history_updated_at ON x_search_history;
CREATE TRIGGER update_x_search_history_updated_at
    BEFORE UPDATE ON x_search_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();