import { NextRequest, NextResponse } from 'next/server'

// CORS Proxyを使用してWordPressに投稿
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

    // Basic認証用のBase64エンコード
    const credentials = Buffer.from(`${wpUsername}:${wpPassword}`).toString('base64')

    // 投稿データ
    const postData = {
      title: title || 'Test Post via Proxy',
      content: content || 'This is a test post sent through proxy',
      status: status
    }

    // AllOrigins Proxyを使用
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`${wpUrl}/wp-json/wp/v2/posts`)}`

    console.log('Trying proxy request to:', proxyUrl)

    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData)
    })

    if (response.status === 201) {
      const wpPost = await response.json()
      return NextResponse.json({
        success: true,
        message: 'Successfully posted via proxy!',
        postId: wpPost.id,
        url: wpPost.link
      })
    }

    const responseText = await response.text()
    return NextResponse.json({
      success: false,
      error: 'Proxy request failed',
      status: response.status,
      details: responseText.substring(0, 200)
    }, { status: response.status })

  } catch (error) {
    console.error('Proxy post error:', error)
    return NextResponse.json({
      success: false,
      error: 'Proxy request failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}