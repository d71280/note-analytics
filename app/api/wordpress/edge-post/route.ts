import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge' // Edgeランタイムを使用

// Edge Functionを使用してWordPressに投稿
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, title, status = 'draft' } = body

    // 環境変数から取得
    const wpUrl = process.env.WP_SITE_URL || 'https://muchino-chi.com'
    const wpUsername = process.env.WP_USERNAME || ''
    const wpPassword = process.env.WP_APP_PASSWORD || ''

    if (!wpUsername || !wpPassword) {
      return NextResponse.json(
        { error: 'WordPress credentials not configured' },
        { status: 500 }
      )
    }

    // Basic認証用のBase64エンコード - EdgeランタイムではBufferが使えないのでbtoa使用
    const credentials = btoa(`${wpUsername}:${wpPassword}`)

    // 投稿データ
    const postData = {
      title: title || 'Edge Function Test Post',
      content: content || 'This is a test post from Edge Function',
      status: status
    }

    // Edge Functionからリクエスト
    const response = await fetch(`${wpUrl}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'ja-JP,ja;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'X-Requested-With': 'XMLHttpRequest',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site'
      },
      body: JSON.stringify(postData)
    })

    console.log('Edge response status:', response.status)

    if (response.status === 201) {
      const wpPost = await response.json()
      return NextResponse.json({
        success: true,
        message: 'Successfully posted via Edge Function!',
        postId: wpPost.id,
        url: wpPost.link
      })
    }

    // 401 = 認証失敗
    if (response.status === 401) {
      return NextResponse.json({
        success: false,
        error: '認証に失敗しました',
        status: response.status
      }, { status: 401 })
    }

    // 403 = 権限不足
    if (response.status === 403) {
      const responseText = await response.text()
      return NextResponse.json({
        success: false,
        error: 'アクセス権限がありません（Edge Function）',
        status: response.status,
        details: responseText.substring(0, 200)
      }, { status: 403 })
    }

    const responseText = await response.text()
    return NextResponse.json({
      success: false,
      error: 'Edge Function request failed',
      status: response.status,
      details: responseText.substring(0, 200)
    }, { status: response.status })

  } catch (error) {
    console.error('Edge post error:', error)
    return NextResponse.json({
      success: false,
      error: 'Edge Function request failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}