import { NextResponse } from 'next/server'

export async function GET() {
  const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  return NextResponse.json({
    status: {
      hasServiceRole,
      hasSupabaseUrl,
      hasAnonKey,
    },
    message: hasServiceRole 
      ? 'Service Role key is configured' 
      : 'Service Role key is NOT configured. Add SUPABASE_SERVICE_ROLE_KEY to environment variables.',
    suggestion: !hasServiceRole 
      ? 'Supabaseダッシュボード → Settings → API → Service Role Key をコピーして、Vercelの環境変数に SUPABASE_SERVICE_ROLE_KEY として設定してください。'
      : null
  })
}