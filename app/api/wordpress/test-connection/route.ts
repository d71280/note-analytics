import { NextResponse } from 'next/server'

export const runtime = 'edge' // Edge Functionを使用

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

    // Basic認証用のBase64エンコード - EdgeランタイムではBufferが使えないのでbtoa使用
    const credentials = btoa(`${wpUsername}:${wpPassword}`)

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
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Origin': 'https://muchino-chi.com',
        'Referer': 'https://muchino-chi.com/wp-admin/',
        'X-Forwarded-For': '153.156.0.1',  // 日本のIPアドレス範囲
        'X-Real-IP': '153.156.0.1'
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
      const responseText = await response.text()
      return NextResponse.json({
        success: false,
        error: 'アクセス権限がありません',
        status: response.status,
        info: 'ユーザーに投稿の読み取り権限があるか確認してください',
        details: responseText.substring(0, 200)
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