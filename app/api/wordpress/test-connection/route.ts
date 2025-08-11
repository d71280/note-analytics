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

    // 投稿の取得で認証をテスト（users/meは権限問題があるため）
    const response = await fetch(`${wpUrl}/wp-json/wp/v2/posts?status=draft,publish&per_page=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('Response status:', response.status)

    // 認証成功 = 200 OK または 空の配列でも200
    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'WordPress認証成功！',
        info: '投稿の取得権限が確認されました'
      })
    }

    // 401 = 認証失敗
    if (response.status === 401) {
      return NextResponse.json({
        success: false,
        error: '認証に失敗しました。アプリケーションパスワードを確認してください',
        status: response.status
      }, { status: 401 })
    }

    // 403 = 認証は成功したが権限不足
    if (response.status === 403) {
      return NextResponse.json({
        success: false,
        error: 'アクセス権限がありません',
        status: response.status,
        info: 'ユーザーに投稿の読み取り権限があるか確認してください'
      }, { status: 403 })
    }

    // その他のエラー
    const responseText = await response.text()
    return NextResponse.json({
      success: false,
      error: `接続エラー (${response.status})`,
      details: responseText.substring(0, 200)
    }, { status: response.status })

  } catch (error) {
    console.error('WordPress connection test error:', error)
    return NextResponse.json({
      success: false,
      error: '接続テスト中にエラーが発生しました',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}