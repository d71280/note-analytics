import { NextResponse } from 'next/server'

export async function GET() {
  // 環境変数の存在確認（値は表示しない）
  const envCheck = {
    NODE_ENV: process.env.NODE_ENV,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasSupabaseService: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasXApiKey: !!process.env.X_API_KEY,
    hasXBearerToken: !!process.env.X_BEARER_TOKEN,
    hasGrokKey: !!process.env.GROK_API_KEY,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
    // 最初の数文字だけ表示（デバッグ用）
    openAIKeyPrefix: process.env.OPENAI_API_KEY ? 
      process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 
      'NOT SET'
  }

  return NextResponse.json({
    success: true,
    environment: envCheck,
    timestamp: new Date().toISOString()
  })
}