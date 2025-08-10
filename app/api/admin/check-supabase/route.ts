import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    const config = {
      url: supabaseUrl,
      anonKey: supabaseAnonKey ? '設定済み' : '未設定',
      serviceKey: supabaseServiceKey ? '設定済み' : '未設定',
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      hasServiceKey: !!supabaseServiceKey
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        error: 'Supabase設定が不完全です',
        config,
        instructions: [
          '1. .env.localファイルを作成してください',
          '2. 以下の環境変数を設定してください:',
          '   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url',
          '   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key',
          '   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key'
        ]
      }, { status: 400 })
    }

    // Supabaseへの接続テスト
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return NextResponse.json({
        success: true,
        message: 'Supabase接続成功',
        config,
        nextSteps: [
          '1. SupabaseダッシュボードでSQL Editorを開く',
          '2. create_gpts_tables.sqlの内容をコピー＆ペースト',
          '3. Runボタンをクリックしてテーブルを作成'
        ]
      })

    } catch (connectionError) {
      return NextResponse.json({
        error: 'Supabase接続に失敗しました',
        config,
        connectionError: connectionError instanceof Error ? connectionError.message : 'Unknown error',
        instructions: [
          '1. Supabaseプロジェクトが正しく設定されているか確認',
          '2. URLとAPIキーが正しいか確認',
          '3. プロジェクトが一時停止されていないか確認'
        ]
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Failed to check Supabase config:', error)
    return NextResponse.json({
      error: '設定確認中にエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 