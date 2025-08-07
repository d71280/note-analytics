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
    hasGrokKey: !!process.env.GROK_API_KEY
  }

  return NextResponse.json({
    success: true,
    environment: envCheck,
    timestamp: new Date().toISOString()
  })
}