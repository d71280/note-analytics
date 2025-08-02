import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import axios from 'axios'

export async function POST(request: NextRequest) {
  try {
    const { tweetId, action = 'retweet' } = await request.json()

    if (!tweetId) {
      return NextResponse.json(
        { error: 'Tweet ID is required' },
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

    // リツイートまたはリツイート解除
    const url = action === 'retweet' 
      ? `https://api.twitter.com/2/users/me/retweets`
      : `https://api.twitter.com/2/users/me/retweets/${tweetId}`

    const response = await axios({
      method: action === 'retweet' ? 'POST' : 'DELETE',
      url,
      data: action === 'retweet' ? { tweet_id: tweetId } : undefined,
      headers: {
        'Authorization': `Bearer ${config.access_token}`,
        'Content-Type': 'application/json'
      }
    })

    // リツイート履歴を保存
    await supabase
      .from('x_retweet_history')
      .insert({
        tweet_id: tweetId,
        action: action,
        created_at: new Date().toISOString()
      })

    return NextResponse.json({ 
      success: true,
      action: action,
      tweetId: tweetId
    })
  } catch (error) {
    console.error('Retweet error:', error)
    
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        return NextResponse.json(
          { error: 'Invalid or expired access token' },
          { status: 401 }
        )
      } else if (error.response?.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          { status: 429 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to process retweet' },
      { status: 500 }
    )
  }
}