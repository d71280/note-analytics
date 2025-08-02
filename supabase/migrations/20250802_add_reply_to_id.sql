-- x_post_historyテーブルにreply_to_idカラムを追加
ALTER TABLE x_post_history
ADD COLUMN IF NOT EXISTS reply_to_id TEXT;

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_x_post_history_reply_to_id ON x_post_history(reply_to_id);

-- コメント追加
COMMENT ON COLUMN x_post_history.reply_to_id IS 'このポストが返信の場合、返信先のツイートID';