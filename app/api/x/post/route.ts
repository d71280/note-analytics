import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import axios from 'axios'

const TWITTER_API_URL = 'https://api.twitter.com/2/tweets'

export async function POST(request: NextRequest) {
  try {
    const { text, postType } = await request.json()

    if (!text || text.length > 280) {
      return NextResponse.json(
        { error: 'Invalid tweet text' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    // API設定を取得
    const { data: config, error: fetchError } = await supabase
      .from('x_api_configs')
      .select('access_token')
      .single()

    if (fetchError || !config) {
      return NextResponse.json(
        { error: 'X API configuration not found' },
        { status: 404 }
      )
    }

    // ツイートを投稿
    const tweetResponse = await axios.post(
      TWITTER_API_URL,
      { text },
      {
        headers: {
          'Authorization': `Bearer ${config.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const { data: { id: tweetId } } = tweetResponse

    // 投稿履歴を保存
    await supabase
      .from('x_post_history')
      .insert({
        post_type: postType || 'manual',
        post_content: text,
        tweet_id: tweetId,
        status: 'success'
      })

    return NextResponse.json({ 
      success: true, 
      tweetId,
      url: `https://twitter.com/i/web/status/${tweetId}`
    })
  } catch (error) {
    console.error('Tweet error:', error)
    
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid or expired access token. Please update your API configuration.' },
        { status: 401 }
      )
    }

    // エラー履歴を保存
    try {
      const { text, postType } = await request.json()
      const supabase = createClient()
      await supabase
        .from('x_post_history')
        .insert({
          post_type: postType || 'manual',
          post_content: text,
          status: 'failed'
        })
    } catch {
      // エラー履歴の保存に失敗しても無視
    }

    return NextResponse.json(
      { error: 'Failed to post tweet' },
      { status: 500 }
    )
  }
}