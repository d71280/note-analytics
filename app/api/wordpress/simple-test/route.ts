import { NextResponse } from 'next/server'

export async function GET() {
  const wpUrl = process.env.WP_SITE_URL
  const wpUsername = process.env.WP_USERNAME
  const wpPassword = process.env.WP_APP_PASSWORD

  // 環境変数の確認
  if (!wpUrl || !wpUsername || !wpPassword) {
    return NextResponse.json({
      error: '環境変数が設定されていません',
      env: {
        url: !!wpUrl,
        username: !!wpUsername,
        password: !!wpPassword
      }
    }, { status: 500 })
  }

  try {
    // 1. まずREST APIが存在するか確認（認証なし）
    const apiCheck = await fetch(`${wpUrl}/wp-json/wp/v2/posts?per_page=1`)
    
    // 2. Basic認証でテスト
    const credentials = Buffer.from(`${wpUsername}:${wpPassword}`).toString('base64')
    const authResponse = await fetch(`${wpUrl}/wp-json/wp/v2/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    })

    const authText = await authResponse.text()
    let authData = null
    try {
      authData = JSON.parse(authText)
    } catch {
      // JSONパースエラー
    }

    return NextResponse.json({
      step1_api_check: {
        status: apiCheck.status,
        ok: apiCheck.ok
      },
      step2_auth_test: {
        status: authResponse.status,
        ok: authResponse.ok,
        data: authData,
        rawText: authResponse.ok ? null : authText.substring(0, 500)
      },
      environment: {
        url: wpUrl,
        username: wpUsername,
        passwordLength: wpPassword.length
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: 'テスト中にエラーが発生',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}