import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import axios from 'axios'

const TWITTER_SEARCH_URL = 'https://api.twitter.com/2/tweets/search/recent'

interface SearchParams {
  query: string
  maxResults?: number
  includeRetweets?: boolean
  minLikes?: number
  minRetweets?: number
}

export async function POST(request: NextRequest) {
  try {
    const { query, includeRetweets = false, minLikes = 0, minRetweets = 0 } = await request.json() as SearchParams

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    // API設定を取得
    const { data: config, error: fetchError } = await supabase
      .from('x_api_configs')
      .select('access_token')
      .single()

    // データベースに設定がない場合は環境変数から取得
    let accessToken = config?.access_token
    if (!accessToken && process.env.X_ACCESS_TOKEN) {
      accessToken = process.env.X_ACCESS_TOKEN
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: 'X API configuration not found. Please set up X API in settings.' },
        { status: 404 }
      )
    }

    // 検索クエリを構築
    let searchQuery = query
    if (!includeRetweets) {
      searchQuery += ' -is:retweet'
    }

    // ツイートを検索
    const response = await axios.get(TWITTER_SEARCH_URL, {
      params: {
        query: searchQuery,
        max_results: 1, // 無料プランの制限対策として1件のみ取得
        'tweet.fields': 'author_id,created_at,public_metrics,entities',
        'user.fields': 'name,username,profile_image_url,verified',
        'expansions': 'author_id'
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    const tweets = response.data.data || []
    const users = response.data.includes?.users || []

    // ユーザー情報をマップ化
    const userMap = users.reduce((acc: Record<string, { id: string; name: string; username: string; profile_image_url?: string }>, user: { id: string; name: string; username: string; profile_image_url?: string }) => {
      acc[user.id] = user
      return acc
    }, {})

    // フィルタリングと整形
    const filteredTweets = tweets
      .filter((tweet: { public_metrics: { like_count: number; retweet_count: number } }) => {
        const metrics = tweet.public_metrics
        return metrics.like_count >= minLikes && metrics.retweet_count >= minRetweets
      })
      .map((tweet: { id: string; text: string; author_id: string; created_at: string; public_metrics: { like_count: number; retweet_count: number; reply_count: number; quote_count: number } }) => ({
        id: tweet.id,
        text: tweet.text,
        author: userMap[tweet.author_id] || {},
        created_at: tweet.created_at,
        metrics: tweet.public_metrics,
        url: `https://twitter.com/i/web/status/${tweet.id}`
      }))

    // 検索履歴を保存
    await supabase
      .from('x_search_history')
      .insert({
        query: query,
        results_count: filteredTweets.length,
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      query: query,
      count: filteredTweets.length,
      tweets: filteredTweets
    })
  } catch (error) {
    console.error('Search error:', error)
    
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
      { error: 'Failed to search tweets' },
      { status: 500 }
    )
  }
}