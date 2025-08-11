import { NextResponse } from 'next/server'

export async function GET() {
  // 環境変数の存在確認（値はマスク表示）
  const wpUrl = process.env.WP_SITE_URL
  const wpUsername = process.env.WP_USERNAME
  const wpPassword = process.env.WP_APP_PASSWORD
  
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    vercelUrl: process.env.VERCEL_URL,
    wordpress: {
      url: {
        exists: !!wpUrl,
        value: wpUrl || 'NOT SET',
      },
      username: {
        exists: !!wpUsername,
        value: wpUsername || 'NOT SET',
      },
      password: {
        exists: !!wpPassword,
        length: wpPassword?.length || 0,
        preview: wpPassword ? `${wpPassword.substring(0, 4)}...` : 'NOT SET'
      }
    },
    debug: {
      allEnvKeys: Object.keys(process.env).filter(key => key.startsWith('WP_')),
      nodeVersion: process.version
    }
  })
}