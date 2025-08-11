import { NextResponse } from 'next/server'

export async function GET() {
  const wpUrl = process.env.WORDPRESS_SITE_URL || process.env.WP_SITE_URL
  const wpUsername = process.env.WORDPRESS_ID || process.env.WP_USERNAME
  const wpPassword = process.env.WORDPRESS_PASSWORD || process.env.WP_APP_PASSWORD

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    wordpress: {
      url: wpUrl ? '設定済み' : '未設定',
      username: wpUsername ? '設定済み' : '未設定',
      password: wpPassword ? '設定済み' : '未設定',
      urlValue: wpUrl || null,
      usernameValue: wpUsername || null,
      passwordValue: wpPassword ? '***' : null
    },
    allEnvVars: {
      WORDPRESS_SITE_URL: process.env.WORDPRESS_SITE_URL ? '設定済み' : '未設定',
      WORDPRESS_ID: process.env.WORDPRESS_ID ? '設定済み' : '未設定',
      WORDPRESS_PASSWORD: process.env.WORDPRESS_PASSWORD ? '設定済み' : '未設定',
      WP_SITE_URL: process.env.WP_SITE_URL ? '設定済み' : '未設定',
      WP_USERNAME: process.env.WP_USERNAME ? '設定済み' : '未設定',
      WP_APP_PASSWORD: process.env.WP_APP_PASSWORD ? '設定済み' : '未設定'
    }
  })
}