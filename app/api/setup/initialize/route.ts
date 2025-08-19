import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// データベース初期化API - 全テーブルを自動作成
export async function POST() {
  try {
    const supabase = createAdminClient()
    const errors: string[] = []
    const successes: string[] = []

    // 1. scheduled_posts テーブル
    const scheduledPostsSQL = `
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
      
      CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
      CREATE INDEX IF NOT EXISTS idx_scheduled_posts_platform ON scheduled_posts(platform);
      CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_for ON scheduled_posts(scheduled_for);
      CREATE INDEX IF NOT EXISTS idx_scheduled_posts_metadata ON scheduled_posts USING GIN (metadata);
    `

    // 2. x_post_history テーブル
    const xPostHistorySQL = `
      CREATE TABLE IF NOT EXISTS x_post_history (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        post_type VARCHAR(50),
        post_content TEXT NOT NULL,
        tweet_id VARCHAR(100),
        reply_to_id VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pending',
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        posted_at TIMESTAMP WITH TIME ZONE
      );
      
      CREATE INDEX IF NOT EXISTS idx_x_post_history_status ON x_post_history(status);
      CREATE INDEX IF NOT EXISTS idx_x_post_history_created ON x_post_history(created_at);
    `

    // 3. tweet_queue テーブル
    const tweetQueueSQL = `
      CREATE TABLE IF NOT EXISTS tweet_queue (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        content TEXT NOT NULL,
        scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'failed', 'cancelled')),
        order_index INTEGER NOT NULL,
        interval_minutes INTEGER DEFAULT 30,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        posted_at TIMESTAMP WITH TIME ZONE
      );
      
      CREATE INDEX IF NOT EXISTS idx_tweet_queue_status ON tweet_queue(status);
      CREATE INDEX IF NOT EXISTS idx_tweet_queue_scheduled ON tweet_queue(scheduled_at);
    `

    // 4. x_api_configs テーブル
    const xApiConfigsSQL = `
      CREATE TABLE IF NOT EXISTS x_api_configs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID,
        api_key TEXT,
        api_secret TEXT,
        access_token TEXT,
        access_token_secret TEXT,
        bearer_token TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_x_api_configs_user ON x_api_configs(user_id);
      CREATE INDEX IF NOT EXISTS idx_x_api_configs_active ON x_api_configs(is_active);
    `

    // 5. error_logs テーブル (新規追加)
    const errorLogsSQL = `
      CREATE TABLE IF NOT EXISTS error_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        error_type VARCHAR(100) NOT NULL,
        error_message TEXT NOT NULL,
        error_stack TEXT,
        context JSONB DEFAULT '{}',
        severity VARCHAR(20) DEFAULT 'error' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);
      CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
      CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at);
    `

    // 6. analytics テーブル (新規追加)
    const analyticsSQL = `
      CREATE TABLE IF NOT EXISTS analytics (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        post_id UUID,
        platform VARCHAR(50) NOT NULL,
        impressions INTEGER DEFAULT 0,
        engagements INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        retweets INTEGER DEFAULT 0,
        replies INTEGER DEFAULT 0,
        tracked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_analytics_post ON analytics(post_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_platform ON analytics(platform);
      CREATE INDEX IF NOT EXISTS idx_analytics_tracked ON analytics(tracked_at);
    `

    // 7. settings テーブル (新規追加)
    const settingsSQL = `
      CREATE TABLE IF NOT EXISTS settings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID,
        key VARCHAR(100) NOT NULL,
        value JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, key)
      );
      
      CREATE INDEX IF NOT EXISTS idx_settings_user ON settings(user_id);
      CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
    `

    // テーブル作成SQLの配列
    const tables = [
      { name: 'scheduled_posts', sql: scheduledPostsSQL },
      { name: 'x_post_history', sql: xPostHistorySQL },
      { name: 'tweet_queue', sql: tweetQueueSQL },
      { name: 'x_api_configs', sql: xApiConfigsSQL },
      { name: 'error_logs', sql: errorLogsSQL },
      { name: 'analytics', sql: analyticsSQL },
      { name: 'settings', sql: settingsSQL }
    ]

    // 各テーブルを作成
    for (const table of tables) {
      try {
        // Supabaseでは直接SQLを実行できないため、テーブルの存在確認のみ
        const { error } = await supabase
          .from(table.name)
          .select('id')
          .limit(1)
        
        if (error?.code === '42P01') {
          // テーブルが存在しない
          errors.push(`${table.name}: テーブルが存在しません。Supabase SQLエディタで作成してください。`)
        } else if (error) {
          errors.push(`${table.name}: ${error.message}`)
        } else {
          successes.push(`${table.name}: ✅ 存在確認済み`)
        }
      } catch (e) {
        errors.push(`${table.name}: ${e instanceof Error ? e.message : '不明なエラー'}`)
      }
    }

    // RLSポリシーの設定SQL（参考用）
    const rlsPoliciesSQL = `
      -- RLSを有効化
      ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE x_post_history ENABLE ROW LEVEL SECURITY;
      ALTER TABLE tweet_queue ENABLE ROW LEVEL SECURITY;
      ALTER TABLE x_api_configs ENABLE ROW LEVEL SECURITY;
      ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
      ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
      ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

      -- 基本的なポリシー（本番環境では適切に制限してください）
      CREATE POLICY "Enable all for authenticated users" ON scheduled_posts
        FOR ALL USING (true) WITH CHECK (true);
      
      CREATE POLICY "Enable all for authenticated users" ON x_post_history
        FOR ALL USING (true) WITH CHECK (true);
      
      CREATE POLICY "Enable all for authenticated users" ON tweet_queue
        FOR ALL USING (true) WITH CHECK (true);
      
      CREATE POLICY "Enable all for authenticated users" ON x_api_configs
        FOR ALL USING (true) WITH CHECK (true);
      
      CREATE POLICY "Enable all for authenticated users" ON error_logs
        FOR ALL USING (true) WITH CHECK (true);
      
      CREATE POLICY "Enable all for authenticated users" ON analytics
        FOR ALL USING (true) WITH CHECK (true);
      
      CREATE POLICY "Enable all for authenticated users" ON settings
        FOR ALL USING (true) WITH CHECK (true);
    `

    // 結果を返す
    const allTablesSQL = tables.map(t => t.sql).join('\n\n')

    return NextResponse.json({
      success: errors.length === 0,
      successes,
      errors,
      totalTables: tables.length,
      message: errors.length === 0 
        ? 'すべてのテーブルが正常に確認されました' 
        : 'いくつかのテーブルが存在しません。以下のSQLをSupabase SQLエディタで実行してください。',
      sqlToRun: errors.length > 0 ? allTablesSQL : null,
      rlsPolicies: rlsPoliciesSQL,
      instructions: errors.length > 0 ? [
        '1. Supabaseダッシュボードにアクセス',
        '2. SQL Editorを開く',
        '3. 上記のsqlToRunの内容をコピー＆ペースト',
        '4. Runボタンをクリック',
        '5. 続いてrlsPoliciesの内容も実行',
        '6. このAPIを再度呼び出して確認'
      ] : null
    })

  } catch (error) {
    console.error('Database initialization error:', error)
    return NextResponse.json(
      { 
        error: 'データベース初期化に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET: 現在のテーブル状態を確認
export async function GET() {
  try {
    const supabase = createAdminClient()
    const tableStatus: Record<string, string> = {}
    
    const tablesToCheck = [
      'scheduled_posts',
      'x_post_history',
      'tweet_queue',
      'x_api_configs',
      'error_logs',
      'analytics',
      'settings'
    ]

    for (const table of tablesToCheck) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (error?.code === '42P01') {
          tableStatus[table] = '❌ 存在しない'
        } else if (error) {
          tableStatus[table] = `⚠️ エラー: ${error.message}`
        } else {
          tableStatus[table] = `✅ 存在 (${count || 0}件のレコード)`
        }
      } catch {
        tableStatus[table] = '❓ 確認できません'
      }
    }

    return NextResponse.json({
      success: true,
      tableStatus,
      totalTables: tablesToCheck.length,
      existingTables: Object.values(tableStatus).filter(s => s.startsWith('✅')).length
    })

  } catch {
    return NextResponse.json(
      { error: 'テーブル状態の確認に失敗しました' },
      { status: 500 }
    )
  }
}