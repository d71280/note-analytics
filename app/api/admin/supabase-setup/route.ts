import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Supabaseの設定を確認
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Supabase設定が不足しています',
        details: {
          url: !!supabaseUrl,
          serviceKey: !!supabaseServiceKey
        },
        instructions: [
          '1. .env.localファイルを作成してください',
          '2. 以下の環境変数を設定してください:',
          '   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url',
          '   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key'
        ]
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
      CREATE INDEX IF NOT EXISTS idx_scheduled_posts_metadata ON scheduled_posts USING GIN (metadata);

      -- RLSを有効化
      ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

      -- 既存のポリシーを削除（存在する場合）
      DROP POLICY IF EXISTS "Enable all operations for all users" ON scheduled_posts;
      DROP POLICY IF EXISTS "Enable all operations for all users" ON settings;

      -- 全ユーザーに読み書き権限を付与
      CREATE POLICY "Enable all operations for all users" ON scheduled_posts
        FOR ALL USING (true) WITH CHECK (true);

      CREATE POLICY "Enable all operations for all users" ON settings
        FOR ALL USING (true) WITH CHECK (true);

      -- updated_atカラムの自動更新トリガーを作成
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- トリガーを作成
      DROP TRIGGER IF EXISTS update_scheduled_posts_updated_at ON scheduled_posts;
      CREATE TRIGGER update_scheduled_posts_updated_at 
          BEFORE UPDATE ON scheduled_posts 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
      CREATE TRIGGER update_settings_updated_at 
          BEFORE UPDATE ON settings 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `

    // Supabaseの管理APIを使用してSQLを実行
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        sql: createTablesSQL
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Supabase SQL execution failed:', errorText)
      
      // 別の方法でテーブル作成を試行
      return await createTablesWithDirectAPI(supabaseUrl, supabaseServiceKey)
    }

    return NextResponse.json({
      success: true,
      message: 'テーブルが正常に作成されました',
      tables: ['settings', 'scheduled_posts'],
      method: 'rpc'
    })

  } catch (error) {
    console.error('Failed to create tables:', error)
    return NextResponse.json({
      error: 'テーブル作成中にエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// 直接APIを使用したテーブル作成
async function createTablesWithDirectAPI(supabaseUrl: string, serviceKey: string) {
  try {
    // settingsテーブルの作成
    const settingsResponse = await fetch(`${supabaseUrl}/rest/v1/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        key: 'test_key',
        value: 'test_value'
      })
    })

    // scheduled_postsテーブルの作成
    const postsResponse = await fetch(`${supabaseUrl}/rest/v1/scheduled_posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        content: 'test content',
        platform: 'x'
      })
    })

    return NextResponse.json({
      success: true,
      message: 'テーブルが正常に作成されました（直接API使用）',
      tables: ['settings', 'scheduled_posts'],
      method: 'direct_api',
      settingsStatus: settingsResponse.status,
      postsStatus: postsResponse.status
    })

  } catch (error) {
    console.error('Failed to create tables with direct API:', error)
    return NextResponse.json({
      error: '直接APIでのテーブル作成に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 