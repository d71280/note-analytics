import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Supabaseの設定を確認
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        error: 'Supabase設定が不足しています',
        details: {
          url: !!supabaseUrl,
          key: !!supabaseKey
        }
      }, { status: 400 })
    }

    // テーブル作成用のSQL
    const createTablesSQL = `
      -- settingsテーブルの作成（APIキー保存用）
      CREATE TABLE IF NOT EXISTS settings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- scheduled_postsテーブルの作成（投稿管理用）
      CREATE TABLE IF NOT EXISTS scheduled_posts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        content TEXT NOT NULL,
        platform VARCHAR(50) NOT NULL CHECK (platform IN ('x', 'note', 'wordpress')),
        scheduled_for TIMESTAMP WITH TIME ZONE,
        status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'scheduled', 'posted', 'failed')),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- インデックスの作成
      CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
      CREATE INDEX IF NOT EXISTS idx_scheduled_posts_platform ON scheduled_posts(platform);
      CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_for ON scheduled_posts(scheduled_for);

      -- RLSを有効化
      ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

      -- 全ユーザーに読み書き権限を付与
      DROP POLICY IF EXISTS "Enable all operations for all users" ON scheduled_posts;
      CREATE POLICY "Enable all operations for all users" ON scheduled_posts
        FOR ALL USING (true) WITH CHECK (true);
      
      DROP POLICY IF EXISTS "Enable all operations for all users" ON settings;
      CREATE POLICY "Enable all operations for all users" ON settings
        FOR ALL USING (true) WITH CHECK (true);
    `

    // SupabaseのREST APIを使用してSQLを実行
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify({
        sql: createTablesSQL
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Supabase SQL execution failed:', errorText)
      return NextResponse.json({
        error: 'テーブル作成に失敗しました',
        details: errorText
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'テーブルが正常に作成されました',
      tables: ['settings', 'scheduled_posts']
    })

  } catch (error) {
    console.error('Failed to create tables:', error)
    return NextResponse.json({
      error: 'テーブル作成中にエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 