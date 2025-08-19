import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getXApiConfig } from '@/lib/x-api/config'
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

    const supabase = createAdminClient()
    
    // API設定を取得
    let config
    try {
      config = getXApiConfig()
    } catch {
      return NextResponse.json(
        { error: 'X API credentials not configured. Please set environment variables.' },
        { status: 500 }
      )
    }

    // リツイートまたはリツイート解除
    const url = action === 'retweet' 
      ? `https://api.twitter.com/2/users/me/retweets`
      : `https://api.twitter.com/2/users/me/retweets/${tweetId}`

    await axios({
      method: action === 'retweet' ? 'POST' : 'DELETE',
      url,
      data: action === 'retweet' ? { tweet_id: tweetId } : undefined,
      headers: {
        'Authorization': `Bearer ${config.bearer_token}`,
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