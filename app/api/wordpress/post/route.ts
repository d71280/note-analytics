import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// WordPress投稿作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, title, platform, postId } = body

    if (platform !== 'wordpress') {
      return NextResponse.json(
        { error: 'This endpoint is for WordPress only' },
        { status: 400 }
      )
    }

    // Supabaseから設定を取得（実装予定）
    // const supabase = createClient()
    // const { data: settings } = await supabase
    //   .from('wordpress_settings')
    //   .select('*')
    //   .single()

    // 暫定的にハードコード（後で環境変数or DBから取得）
    const wpUrl = 'https://muchino-chi.com'
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

    // WordPress REST APIにPOST
    const wpResponse = await fetch(`${wpUrl}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify({
        title: title || 'Untitled',
        content: content,
        status: 'publish', // または 'draft' で下書き保存
        // カスタムフィールドが必要な場合
        meta: {
          _aioseo_title: title,
          _aioseo_description: content.substring(0, 160)
        }
      })
    })

    if (!wpResponse.ok) {
      const error = await wpResponse.text()
      console.error('WordPress API error:', error)
      return NextResponse.json(
        { error: 'Failed to post to WordPress', details: error },
        { status: wpResponse.status }
      )
    }

    const wpPost = await wpResponse.json()

    // 投稿成功後、ステータスを更新
    if (postId) {
      const supabase = createClient()
      await supabase
        .from('scheduled_posts')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString(),
          wordpress_post_id: wpPost.id,
          wordpress_url: wpPost.link
        })
        .eq('id', postId)
    }

    return NextResponse.json({
      success: true,
      postId: wpPost.id,
      url: wpPost.link,
      message: 'Successfully posted to WordPress'
    })

  } catch (error) {
    console.error('WordPress post error:', error)
    return NextResponse.json(
      { error: 'Failed to post to WordPress' },
      { status: 500 }
    )
  }
}

// WordPress投稿の更新
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { postId, content, title } = body

    const wpUrl = 'https://muchino-chi.com'
    const wpUsername = process.env.WP_USERNAME || ''
    const wpPassword = process.env.WP_APP_PASSWORD || ''

    const credentials = Buffer.from(`${wpUsername}:${wpPassword}`).toString('base64')

    const wpResponse = await fetch(`${wpUrl}/wp-json/wp/v2/posts/${postId}`, {
      method: 'POST', // WordPressのREST APIは更新にPOSTを使用
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify({
        title: title,
        content: content
      })
    })

    if (!wpResponse.ok) {
      const error = await wpResponse.text()
      return NextResponse.json(
        { error: 'Failed to update WordPress post', details: error },
        { status: wpResponse.status }
      )
    }

    const wpPost = await wpResponse.json()

    return NextResponse.json({
      success: true,
      postId: wpPost.id,
      url: wpPost.link,
      message: 'Successfully updated WordPress post'
    })

  } catch (error) {
    console.error('WordPress update error:', error)
    return NextResponse.json(
      { error: 'Failed to update WordPress post' },
      { status: 500 }
    )
  }
}

// WordPress投稿の削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    const wpUrl = 'https://muchino-chi.com'
    const wpUsername = process.env.WP_USERNAME || ''
    const wpPassword = process.env.WP_APP_PASSWORD || ''

    const credentials = Buffer.from(`${wpUsername}:${wpPassword}`).toString('base64')

    const wpResponse = await fetch(`${wpUrl}/wp-json/wp/v2/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${credentials}`
      }
    })

    if (!wpResponse.ok) {
      const error = await wpResponse.text()
      return NextResponse.json(
        { error: 'Failed to delete WordPress post', details: error },
        { status: wpResponse.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully deleted WordPress post'
    })

  } catch (error) {
    console.error('WordPress delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete WordPress post' },
      { status: 500 }
    )
  }
}