import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // 環境変数から設定を取得
    const config = {
      url: process.env.WORDPRESS_SITE_URL || process.env.WP_SITE_URL || '',
      username: process.env.WORDPRESS_ID || process.env.WP_USERNAME || '',
      hasPassword: !!(process.env.WORDPRESS_PASSWORD || process.env.WP_APP_PASSWORD),
      password: (process.env.WORDPRESS_PASSWORD || process.env.WP_APP_PASSWORD) ? '••••••••••••••••••••' : '' // パスワードはマスク表示
    }

    return NextResponse.json({
      success: true,
      config,
      message: config.url && config.username && config.hasPassword 
        ? 'WordPress設定は環境変数から読み込まれています' 
        : 'WordPress設定が不完全です'
    })
  } catch (error) {
    console.error('Get config error:', error)
    return NextResponse.json({
      success: false,
      error: '設定の取得に失敗しました'
    }, { status: 500 })
  }
}