import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // テスト投稿データ
    const testPost = {
      platform: 'wordpress',
      title: 'REST APIテスト投稿',
      content: '<p>これはWordPress REST APIのテスト投稿です。</p><p>アプリケーションパスワードを使用した認証でこの投稿が作成されました。</p>',
      status: 'draft', // 下書きとして保存
      excerpt: 'WordPress REST APIのテスト投稿です。',
      categories: [], // カテゴリIDの配列
      tags: [], // タグIDの配列
      format: 'standard',
      comment_status: 'open',
      ping_status: 'open',
      sticky: false,
      meta: {
        _aioseo_title: 'REST APIテスト投稿 | SEOタイトル',
        _aioseo_description: 'WordPress REST APIを使用したテスト投稿の説明文です。'
      }
    }

    // 環境変数から直接認証情報を取得
    const wpUrl = process.env.WP_SITE_URL
    const wpUsername = process.env.WP_USERNAME
    const wpPassword = process.env.WP_APP_PASSWORD

    if (!wpUrl || !wpUsername || !wpPassword) {
      return NextResponse.json({
        success: false,
        error: 'WordPress認証情報が設定されていません'
      }, { status: 500 })
    }

    const credentials = Buffer.from(`${wpUsername}:${wpPassword}`).toString('base64')

    // WordPress REST APIに直接POST
    const response = await fetch(`${wpUrl}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify({
        title: testPost.title,
        content: testPost.content,
        status: testPost.status,
        excerpt: testPost.excerpt,
        format: testPost.format,
        comment_status: testPost.comment_status,
        ping_status: testPost.ping_status,
        sticky: testPost.sticky,
        meta: testPost.meta
      })
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(result, { status: response.status })
    }

    return NextResponse.json({
      success: true,
      message: 'テスト投稿が作成されました',
      post: result
    })

  } catch (error) {
    console.error('Test post error:', error)
    return NextResponse.json({
      success: false,
      error: 'テスト投稿の作成に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}