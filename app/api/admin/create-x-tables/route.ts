import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  try {
    const supabase = createAdminClient()
    
    // x_api_configsテーブルの作成
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS x_api_configs (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          api_key TEXT NOT NULL,
          api_key_secret TEXT NOT NULL,
          access_token TEXT NOT NULL,
          access_token_secret TEXT NOT NULL,
          bearer_token TEXT,
          username TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );

        -- RLSポリシーの設定
        ALTER TABLE x_api_configs ENABLE ROW LEVEL SECURITY;
        
        -- 既存のポリシーを削除（存在する場合）
        DROP POLICY IF EXISTS "Users can view own x_api_configs" ON x_api_configs;
        DROP POLICY IF EXISTS "Users can insert own x_api_configs" ON x_api_configs;
        DROP POLICY IF EXISTS "Users can update own x_api_configs" ON x_api_configs;
        DROP POLICY IF EXISTS "Users can delete own x_api_configs" ON x_api_configs;
        
        -- RLSポリシーの作成
        CREATE POLICY "Users can view own x_api_configs" ON x_api_configs FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own x_api_configs" ON x_api_configs FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own x_api_configs" ON x_api_configs FOR UPDATE USING (auth.uid() = user_id);
        CREATE POLICY "Users can delete own x_api_configs" ON x_api_configs FOR DELETE USING (auth.uid() = user_id);
      `
    })

    if (createError) {
      console.error('Failed to create tables:', createError)
      return NextResponse.json(
        { error: 'Failed to create tables', details: createError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Tables created successfully' })
  } catch (error) {
    console.error('Create tables error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}