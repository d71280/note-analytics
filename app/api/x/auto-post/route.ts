import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getXApiConfig } from '@/lib/x-api/config'
import axios from 'axios'

const TWITTER_API_URL = 'https://api.twitter.com/2/tweets'

interface TrendData {
  keyword: string
  count: number
  growth: number
}

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json()
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

    // 投稿設定を取得
    const { data: settings, error: settingsError } = await supabase
      .from('x_post_settings')
      .select('post_daily_trends, post_featured_articles')
      .single()

    if (settingsError || !settings) {
      return NextResponse.json(
        { error: 'Post settings not found' },
        { status: 404 }
      )
    }

    // 投稿タイプに応じてチェック
    if (type === 'daily_trends' && !settings.post_daily_trends) {
      return NextResponse.json(
        { error: 'Daily trends posting is disabled' },
        { status: 400 }
      )
    }

    if (type === 'featured_articles' && !settings.post_featured_articles) {
      return NextResponse.json(
        { error: 'Featured articles posting is disabled' },
        { status: 400 }
      )
    }

    let tweetText = ''

    if (type === 'daily_trends') {
      const trends = data as TrendData[]
      tweetText = `📊 本日のnoteトレンド\n\n`
      trends.slice(0, 3).forEach((trend, index) => {
        tweetText += `${index + 1}. ${trend.keyword} (${trend.count}件)\n`
      })
      tweetText += `\n#note #トレンド分析`
    } else if (type === 'featured_articles') {
      const { title, author, views, url } = data
      tweetText = `🎯 注目記事\n\n「${title}」\n著者: ${author}\n閲覧数: ${views.toLocaleString()}\n\n${url}\n\n#note #注目記事`
    }

    if (tweetText.length > 280) {
      tweetText = tweetText.substring(0, 277) + '...'
    }

    try {
      const tweetResponse = await axios.post(
        TWITTER_API_URL,
        { text: tweetText },
        {
          headers: {
            'Authorization': `Bearer ${config.bearer_token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const { data: { id: tweetId } } = tweetResponse

      // 投稿履歴を保存
      await supabase
        .from('x_post_history')
        .insert({
          post_type: type,
          post_content: tweetText,
          tweet_id: tweetId,
          status: 'success'
        })

      // 最終投稿日時を更新
      await supabase
        .from('x_post_settings')
        .update({ last_posted_at: new Date().toISOString() })
        .single()

      return NextResponse.json({
        success: true,
        tweetId,
        url: `https://twitter.com/i/web/status/${tweetId}`
      })
    } catch (error) {
      console.error('Tweet error:', error)
      
      // エラー履歴を保存
      await supabase
        .from('x_post_history')
        .insert({
          post_type: type,
          post_content: tweetText,
          status: 'failed'
        })

      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return NextResponse.json(
          { error: 'Invalid or expired access token' },
          { status: 401 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to post tweet' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Auto post error:', error)
    return NextResponse.json(
      { error: 'Failed to process auto post' },
      { status: 500 }
    )
  }
}