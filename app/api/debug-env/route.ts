import { NextResponse } from 'next/server'

export async function GET() {
  // 環境変数の存在確認（値は表示しない）
  const password = process.env.WP_APP_PASSWORD || ''
  return NextResponse.json({
    hasWpUrl: !!process.env.WP_SITE_URL,
    hasWpUsername: !!process.env.WP_USERNAME,
    hasWpPassword: !!process.env.WP_APP_PASSWORD,
    wpUrl: process.env.WP_SITE_URL || 'NOT_SET',
    wpUsername: process.env.WP_USERNAME ? '***SET***' : 'NOT_SET',
    wpPassword: process.env.WP_APP_PASSWORD ? '***SET***' : 'NOT_SET',
    passwordLength: password.length,
    passwordHasSpace: password.includes(' '),
    timestamp: new Date().toISOString()
  })
}