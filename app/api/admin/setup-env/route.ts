import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    const envExists = fs.existsSync(envPath)
    
    const currentEnv = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '未設定',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '設定済み' : '未設定',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '設定済み' : '未設定',
      GPTS_API_KEY: process.env.GPTS_API_KEY ? '設定済み' : '未設定'
    }

    return NextResponse.json({
      envFileExists: envExists,
      currentEnv,
      instructions: [
        '1. プロジェクトルートに .env.local ファイルを作成してください',
        '2. 以下の内容を追加してください:',
        '',
        'NEXT_PUBLIC_SUPABASE_URL=https://tgoeimslzozeicgtdeco.supabase.co',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here',
        'SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here',
        'GPTS_API_KEY=gpts_29b88461559e6d8fa50f0ea176414f354b497cbd4435299eaf43ae35f2666abc',
        '',
        '3. SupabaseダッシュボードでAPIキーを取得してください'
      ]
    })

  } catch (error) {
    console.error('Failed to check environment:', error)
    return NextResponse.json({
      error: '環境変数の確認中にエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { supabaseUrl, anonKey, serviceKey } = await request.json()
    
    if (!supabaseUrl || !anonKey || !serviceKey) {
      return NextResponse.json({
        error: '必要な環境変数が不足しています',
        required: ['supabaseUrl', 'anonKey', 'serviceKey']
      }, { status: 400 })
    }

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

    return NextResponse.json({
      success: true,
      message: '.env.localファイルが作成されました',
      filePath: envPath,
      nextSteps: [
        '1. 開発サーバーを再起動してください: npm run dev',
        '2. テーブル作成APIを実行してください: POST /api/admin/supabase-setup'
      ]
    })

  } catch (error) {
    console.error('Failed to create env file:', error)
    return NextResponse.json({
      error: '環境変数ファイルの作成中にエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 