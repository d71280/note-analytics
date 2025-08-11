import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
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

    // 内部APIを呼び出し
    const response = await fetch('http://localhost:3000/api/wordpress/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPost)
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