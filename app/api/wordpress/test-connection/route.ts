import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // 環境変数から直接取得
    const wpUrl = process.env.WP_SITE_URL
    const wpUsername = process.env.WP_USERNAME
    const wpPassword = process.env.WP_APP_PASSWORD

    if (!wpUrl || !wpUsername || !wpPassword) {
      return NextResponse.json({
        success: false,
        error: 'WordPress認証情報が設定されていません',
        missing: {
          url: !wpUrl,
          username: !wpUsername,
          password: !wpPassword
        }
      }, { status: 500 })
    }

    // Basic認証用のBase64エンコード
    const credentials = Buffer.from(`${wpUsername}:${wpPassword}`).toString('base64')

    console.log('Testing WordPress authentication...')
    console.log('Site URL:', wpUrl)
    console.log('Username:', wpUsername)

    // test-authと同じようにusers/meエンドポイントでテスト
    const response = await fetch(`${wpUrl}/wp-json/wp/v2/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    })

    const responseText = await response.text()
    console.log('Response status:', response.status)
    console.log('Response body:', responseText)

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: '認証に失敗しました',
        status: response.status,
        details: responseText
      }, { status: response.status })
    }

    const userData = JSON.parse(responseText)

    return NextResponse.json({
      success: true,
      message: 'WordPress認証成功',
      user: {
        id: userData.id,
        name: userData.name,
        slug: userData.slug
      }
    })

  } catch (error) {
    console.error('WordPress connection test error:', error)
    return NextResponse.json({
      success: false,
      error: '接続テスト中にエラーが発生しました',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}