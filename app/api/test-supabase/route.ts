import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    // 環境変数の確認
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!hasUrl || !hasAnonKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase環境変数が設定されていません',
        config: {
          hasUrl,
          hasAnonKey,
          hasServiceKey
        }
      })
    }
    
    // Supabaseクライアントを作成
    const supabase = createClient()
    
    // データベース接続テスト - knowledge_baseテーブルの件数を取得
    const { count, error: countError } = await supabase
      .from('knowledge_base')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      return NextResponse.json({
        success: false,
        error: 'データベース接続エラー',
        details: countError.message,
        config: {
          hasUrl,
          hasAnonKey,
          hasServiceKey,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
        }
      })
    }
    
    // テーブルの存在確認
    const tables = ['knowledge_base', 'knowledge_chunks', 'knowledge_generation_history']
    const tableStatus: Record<string, boolean> = {}
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('id', { count: 'exact', head: true })
        .limit(1)
      
      tableStatus[table] = !error
    }
    
    return NextResponse.json({
      success: true,
      message: 'Supabase接続成功',
      database: {
        connected: true,
        knowledge_base_count: count || 0,
        tables: tableStatus
      },
      config: {
        hasUrl,
        hasAnonKey,
        hasServiceKey,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
      }
    })
    
  } catch (error) {
    console.error('Supabase test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Supabaseテストエラー',
      message: error instanceof Error ? error.message : String(error)
    })
  }
}