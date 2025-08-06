import { NextResponse } from 'next/server'

export async function GET() {
  // 環境変数の存在確認
  const envVars = {
    X_API_KEY: !!process.env.X_API_KEY,
    X_API_SECRET: !!process.env.X_API_SECRET,
    X_ACCESS_TOKEN: !!process.env.X_ACCESS_TOKEN,
    X_ACCESS_SECRET: !!process.env.X_ACCESS_SECRET,
    X_BEARER_TOKEN: !!process.env.X_BEARER_TOKEN,
    GROK_API_KEY: !!process.env.GROK_API_KEY,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }

  // マスクされた値を返す（最初と最後の4文字のみ表示）
  const maskedVars: Record<string, string> = {}
  
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('X_') || key.includes('API') || key.includes('SUPABASE')) {
      if (value && value.length > 8) {
        maskedVars[key] = `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
      } else if (value) {
        maskedVars[key] = '***'
      } else {
        maskedVars[key] = 'Not set'
      }
    }
  }

  return NextResponse.json({
    check: envVars,
    masked: maskedVars,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV
  })
}