import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // 環境変数から直接取得
    const wpUrl = process.env.WORDPRESS_SITE_URL || process.env.WP_SITE_URL
    const wpUsername = process.env.WORDPRESS_ID || process.env.WP_USERNAME
    const wpPassword = process.env.WORDPRESS_PASSWORD || process.env.WP_APP_PASSWORD

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

    // シンプルに投稿作成の権限をテスト（実際に使用する機能）
    // 空のタイトルで下書きを作成してすぐ削除
    const testPost = {
      title: 'Connection Test',
      content: 'This is a test post',
      status: 'draft'
    }

    const response = await fetch(`${wpUrl}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPost)
    })

    console.log('Response status:', response.status)

    // 認証成功 = 201 Created（投稿が作成された）
    if (response.status === 201) {
      // テスト投稿を削除
      const createdPost = await response.json()
      if (createdPost.id) {
        await fetch(`${wpUrl}/wp-json/wp/v2/posts/${createdPost.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Basic ${credentials}`
          }
        })
      }
      
      return NextResponse.json({
        success: true,
        message: 'WordPress認証成功！',
        info: '投稿の作成・削除権限が確認されました'
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