import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // scheduled_postsテーブルを作成
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS scheduled_posts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          content TEXT NOT NULL,
          platform VARCHAR(50) NOT NULL,
          scheduled_for TIMESTAMP WITH TIME ZONE,
          status VARCHAR(50) DEFAULT 'draft',
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- インデックスを作成
        CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
        CREATE INDEX IF NOT EXISTS idx_scheduled_posts_platform ON scheduled_posts(platform);
        CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_for ON scheduled_posts(scheduled_for);
        CREATE INDEX IF NOT EXISTS idx_scheduled_posts_metadata ON scheduled_posts USING GIN (metadata);
      `
    }).catch(() => {
      // exec_sql RPCが存在しない場合、直接SQLを実行
      return null
    })
    
    // テーブルの存在確認
    const { data: tableExists, error: checkError } = await supabase
      .from('scheduled_posts')
      .select('id')
      .limit(1)
    
    if (checkError?.code === '42P01') {
      // テーブルが存在しない場合
      return NextResponse.json({
        success: false,
        message: 'Table does not exist and could not be created. Please create it manually in Supabase.',
        sql: `
          CREATE TABLE scheduled_posts (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            content TEXT NOT NULL,
            platform VARCHAR(50) NOT NULL,
            scheduled_for TIMESTAMP WITH TIME ZONE,
            status VARCHAR(50) DEFAULT 'draft',
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database is properly configured',
      tables: {
        scheduled_posts: 'exists'
      }
    })
    
  } catch (error) {
    console.error('Database setup error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to setup database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST: テーブルを手動で作成
export async function POST() {
  try {
    const supabase = createClient()
    
    // Supabaseのダッシュボードで実行するSQL
    const createTableSQL = `
      -- scheduled_postsテーブル
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

      -- インデックス
      CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
      CREATE INDEX IF NOT EXISTS idx_scheduled_posts_platform ON scheduled_posts(platform);
      CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_for ON scheduled_posts(scheduled_for);
      CREATE INDEX IF NOT EXISTS idx_scheduled_posts_metadata ON scheduled_posts USING GIN (metadata);

      -- RLS (Row Level Security)
      ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

      -- ポリシー（誰でも読み書き可能 - 必要に応じて調整）
      CREATE POLICY "Enable all operations for all users" ON scheduled_posts
        FOR ALL USING (true) WITH CHECK (true);
    `;
    
    return NextResponse.json({
      success: true,
      message: 'Please run the following SQL in Supabase Dashboard',
      sql: createTableSQL,
      instructions: [
        '1. Go to Supabase Dashboard',
        '2. Navigate to SQL Editor',
        '3. Copy and paste the SQL above',
        '4. Click "Run" to execute',
        '5. Refresh this page to verify'
      ]
    })
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate SQL' },
      { status: 500 }
    )
  }
}