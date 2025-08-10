import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: Request) {
  try {
    const { supabaseUrl, anonKey, serviceKey } = await request.json()
    
    if (!supabaseUrl || !anonKey || !serviceKey) {
      return NextResponse.json({
        error: '必要な環境変数が不足しています',
        required: ['supabaseUrl', 'anonKey', 'serviceKey']
      }, { status: 400 })
    }

    const results = {
      envSetup: false,
      tableCreation: false,
      apiKeyGeneration: false,
      errors: [] as string[]
    }

    // ステップ1: 環境変数ファイルの作成
    try {
      const envContent = `# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}
SUPABASE_SERVICE_ROLE_KEY=${serviceKey}

# GPTs連携用APIキー
GPTS_API_KEY=gpts_29b88461559e6d8fa50f0ea176414f354b497cbd4435299eaf43ae35f2666abc

# OpenAI APIキー（既存の設定があれば保持）
OPENAI_API_KEY=your_openai_api_key_here
`

      const envPath = path.join(process.cwd(), '.env.local')
      fs.writeFileSync(envPath, envContent)
      results.envSetup = true
    } catch (error) {
      results.errors.push(`環境変数設定エラー: ${error}`)
    }

    // ステップ2: テーブル作成
    try {
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

        -- 既存のポリシーを削除（存在する場合）
        DROP POLICY IF EXISTS "Enable all operations for all users" ON scheduled_posts;
        DROP POLICY IF EXISTS "Enable all operations for all users" ON settings;

        -- 全ユーザーに読み書き権限を付与
        CREATE POLICY "Enable all operations for all users" ON scheduled_posts
          FOR ALL USING (true) WITH CHECK (true);

        CREATE POLICY "Enable all operations for all users" ON settings
          FOR ALL USING (true) WITH CHECK (true);
      `

      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey
        },
        body: JSON.stringify({
          sql: createTablesSQL
        })
      })

      if (response.ok) {
        results.tableCreation = true
      } else {
        // 直接APIでテーブル作成を試行
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

        if (settingsResponse.ok || postsResponse.ok) {
          results.tableCreation = true
        } else {
          results.errors.push('テーブル作成に失敗しました')
        }
      }
    } catch (error) {
      results.errors.push(`テーブル作成エラー: ${error}`)
    }

    // ステップ3: APIキー生成テスト
    try {
      const apiKeyResponse = await fetch('http://localhost:3000/api/gpts/api-key', {
        method: 'POST'
      })

      if (apiKeyResponse.ok) {
        results.apiKeyGeneration = true
      } else {
        results.errors.push('APIキー生成に失敗しました')
      }
    } catch (error) {
      results.errors.push(`APIキー生成エラー: ${error}`)
    }

    const success = results.envSetup && results.tableCreation && results.apiKeyGeneration

    return NextResponse.json({
      success,
      results,
      nextSteps: success ? [
        '1. 開発サーバーを再起動してください: npm run dev',
        '2. GPTsのActions設定を行ってください',
        '3. テスト投稿を実行してください'
      ] : [
        '1. エラーを確認してください',
        '2. Supabaseプロジェクトが一時停止されていないか確認してください',
        '3. 再度セットアップを実行してください'
      ]
    })

  } catch (error) {
    console.error('Failed to complete setup:', error)
    return NextResponse.json({
      error: 'セットアップ中にエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 