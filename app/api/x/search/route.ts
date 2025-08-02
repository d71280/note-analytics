import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import axios from 'axios'

const TWITTER_SEARCH_URL = 'https://api.x.com/2/tweets/search/recent'

interface SearchParams {
  query: string
  maxResults?: number
  includeRetweets?: boolean
  minLikes?: number
  minRetweets?: number
  minReplies?: number
  language?: string
  minImpressions?: number
  hasMedia?: boolean
  isVerified?: boolean
  dateFrom?: string
  dateTo?: string
}

export async function POST(request: NextRequest) {
  try {
    const { 
      query, 
      includeRetweets = false, 
      minLikes = 0, 
      minRetweets = 0,
      minReplies = 0,
      language,
      minImpressions = 0,
      hasMedia = false,
      isVerified = false,
      dateFrom,
      dateTo
    } = await request.json() as SearchParams

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    // X API認証情報を取得
    const bearerToken = process.env.X_BEARER_TOKEN
    const accessToken = process.env.X_ACCESS_TOKEN
    const apiKey = process.env.X_API_KEY
    
    // 利用可能な認証方法を確認
    const authToken = bearerToken || accessToken || apiKey
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'X API authentication not found. Please set X_BEARER_TOKEN, X_ACCESS_TOKEN, or X_API_KEY in environment variables.' },
        { status: 404 }
      )
    }

    // 検索クエリを構築
    let searchQuery = query
    
    // リツイート除外
    if (!includeRetweets) {
      searchQuery += ' -is:retweet'
    }
    
    // 言語指定
    if (language) {
      searchQuery += ` lang:${language}`
    }
    
    // メディア付きツイートのみ
    if (hasMedia) {
      searchQuery += ' has:media'
    }
    
    // 認証済みアカウントのみ
    if (isVerified) {
      searchQuery += ' from:verified'
    }
    
    // 日付範囲
    if (dateFrom) {
      searchQuery += ` since:${dateFrom}`
    }
    if (dateTo) {
      searchQuery += ` until:${dateTo}`
    }
    
    // インプレッション数による暗示的フィルタリング
    // 高インプレッションを期待する場合は、エンゲージメントの高いツイートを優先
    if (minImpressions > 100) {
      searchQuery += ' min_replies:1 OR min_faves:10 OR min_retweets:1'
    }

    // ツイートを検索
    console.log('X API Search Request:', {
      url: TWITTER_SEARCH_URL,
      query: searchQuery,
      hasToken: !!authToken,
      tokenType: bearerToken ? 'Bearer' : accessToken ? 'Access' : 'API Key',
      tokenPreview: authToken ? `${authToken.substring(0, 10)}...` : null
    })
    
    const response = await axios.get(TWITTER_SEARCH_URL, {
      params: {
        query: searchQuery,
        max_results: 10, // X API v2の最小値は10（後でコードで1件に制限）
        'tweet.fields': 'author_id,created_at,public_metrics,entities,context_annotations',
        'user.fields': 'name,username,profile_image_url,verified',
        'expansions': 'author_id'
      },
      headers: {
        'Authorization': `Bearer ${authToken}`
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
      .filter((tweet: { public_metrics: { like_count: number; retweet_count: number; reply_count: number; impression_count?: number } }) => {
        const metrics = tweet.public_metrics
        const impressions = metrics.impression_count || (metrics.like_count + metrics.retweet_count * 2 + metrics.reply_count)
        
        return (
          metrics.like_count >= minLikes && 
          metrics.retweet_count >= minRetweets &&
          metrics.reply_count >= minReplies &&
          impressions >= minImpressions
        )
      })
      .map((tweet: { id: string; text: string; author_id: string; created_at: string; public_metrics: { like_count: number; retweet_count: number; reply_count: number; quote_count: number } }) => ({
        id: tweet.id,
        text: tweet.text,
        author: userMap[tweet.author_id] || {},
        created_at: tweet.created_at,
        metrics: tweet.public_metrics,
        url: `https://twitter.com/i/web/status/${tweet.id}`
      }))
      .slice(0, 1) // API制限回避のため1件のみ表示

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
      console.error('X API Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      })
      
      if (error.response?.status === 401) {
        return NextResponse.json(
          { 
            error: 'Invalid or expired access token',
            details: error.response?.data,
            message: 'X APIの認証に失敗しました。アクセストークンを再生成する必要があります。'
          },
          { status: 401 }
        )
      } else if (error.response?.status === 429) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            message: 'X APIのレート制限に達しました。しばらく待ってから再試行してください。'
          },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        { 
          error: error.response?.data?.detail || error.response?.data?.error || 'X API error',
          status: error.response?.status,
          message: 'X APIからエラーが返されました。'
        },
        { status: error.response?.status || 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to search tweets' },
      { status: 500 }
    )
  }
}