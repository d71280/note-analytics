-- pgvector拡張を有効化（ベクトル検索用）
CREATE EXTENSION IF NOT EXISTS vector;

-- 知識ベースコンテンツを保存するテーブル
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT CHECK (content_type IN ('blog', 'video_transcript', 'note', 'tweet', 'other')),
    source_url TEXT,
    author TEXT,
    tags TEXT[],
    created_date TIMESTAMP WITH TIME ZONE,
    embedding vector(1536), -- OpenAI embeddings dimension
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX idx_knowledge_base_content_type ON knowledge_base(content_type);
CREATE INDEX idx_knowledge_base_tags ON knowledge_base USING GIN(tags);
CREATE INDEX idx_knowledge_base_created_date ON knowledge_base(created_date);

-- ベクトル検索用のインデックス
CREATE INDEX idx_knowledge_base_embedding ON knowledge_base USING ivfflat (embedding vector_cosine_ops);

-- 知識ベースのチャンク（分割されたコンテンツ）を保存するテーブル
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    knowledge_id UUID REFERENCES knowledge_base(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- チャンクのインデックス
CREATE INDEX idx_knowledge_chunks_knowledge_id ON knowledge_chunks(knowledge_id);
CREATE INDEX idx_knowledge_chunks_embedding ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops);

-- 生成履歴を保存するテーブル
CREATE TABLE IF NOT EXISTS knowledge_generation_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prompt TEXT NOT NULL,
    generated_content TEXT NOT NULL,
    used_knowledge_ids UUID[],
    model TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 更新時刻を自動更新するトリガー
CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE
    ON knowledge_base FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 類似コンテンツを検索する関数
CREATE OR REPLACE FUNCTION search_similar_knowledge(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    content_type TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        kb.id,
        kb.title,
        kb.content,
        kb.content_type,
        1 - (kb.embedding <=> query_embedding) AS similarity
    FROM knowledge_base kb
    WHERE 1 - (kb.embedding <=> query_embedding) > match_threshold
    ORDER BY kb.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;