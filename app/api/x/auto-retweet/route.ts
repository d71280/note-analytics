import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import axios from 'axios'

interface RetweetCriteria {
  keywords?: string[]
  minLikes?: number
  minRetweets?: number
  fromUsers?: string[]
}

export async function POST(request: NextRequest) {
  try {
    const { searchQuery, criteria } = await request.json() as { 
      searchQuery: string
      criteria: RetweetCriteria 
    }

    const supabase = createClient()
    
    // API設定を取得
    const { data: config, error: configError } = await supabase
      .from('x_api_configs')
      .select('access_token')
      .single()

    if (configError || !config) {
      return NextResponse.json(
        { error: 'X API configuration not found' },
        { status: 404 }
      )
    }

    // 自動リツイート設定を取得
    const { data: settings } = await supabase
      .from('x_retweet_settings')
      .select('*')
      .single()

    if (!settings?.enabled) {
      return NextResponse.json(
        { error: 'Auto retweet is disabled' },
        { status: 400 }
      )
    }

    // ツイートを検索
    const searchResponse = await axios.get(
      `https://api.twitter.com/2/tweets/search/recent`,
      {
        params: {
          query: searchQuery,
          max_results: 10,
          'tweet.fields': 'public_metrics,author_id,created_at'
        },
        headers: {
          'Authorization': `Bearer ${config.access_token}`
        }
      }
    )

    const tweets = searchResponse.data.data || []
    const retweetedIds: string[] = []

    for (const tweet of tweets) {
      const { public_metrics, id } = tweet

      // 条件チェック
      let shouldRetweet = true

      if (criteria.minLikes && public_metrics.like_count < criteria.minLikes) {
        shouldRetweet = false
      }

      if (criteria.minRetweets && public_metrics.retweet_count < criteria.minRetweets) {
        shouldRetweet = false
      }

      // すでにリツイート済みかチェック
      const { data: existing } = await supabase
        .from('x_retweet_history')
        .select('id')
        .eq('tweet_id', id)
        .eq('action', 'retweet')
        .single()

      if (existing) {
        shouldRetweet = false
      }

      if (shouldRetweet) {
        try {
          // リツイート実行
          await axios.post(
            'https://api.twitter.com/2/users/me/retweets',
            { tweet_id: id },
            {
              headers: {
                'Authorization': `Bearer ${config.access_token}`,
                'Content-Type': 'application/json'
              }
            }
          )

          // 履歴に保存
          await supabase
            .from('x_retweet_history')
            .insert({
              tweet_id: id,
              action: 'retweet',
              auto_retweet: true,
              search_query: searchQuery,
              created_at: new Date().toISOString()
            })

          retweetedIds.push(id)
        } catch (error) {
          console.error(`Failed to retweet ${id}:`, error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      retweetedCount: retweetedIds.length,
      retweetedIds
    })
  } catch (error) {
    console.error('Auto retweet error:', error)
    
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid or expired access token' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process auto retweet' },
      { status: 500 }
    )
  }
}