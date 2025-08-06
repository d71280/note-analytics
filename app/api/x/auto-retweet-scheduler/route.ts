import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getXApiConfig } from '@/lib/x-api/config'
import axios from 'axios'

const TWITTER_SEARCH_URL = 'https://api.twitter.com/2/tweets/search/recent'

export async function POST() {
  try {
    const supabase = createClient()

    // リツイート設定を取得
    const { data: settings, error: settingsError } = await supabase
      .from('x_retweet_settings')
      .select('*')
      .single()

    if (settingsError || !settings || !settings.enabled) {
      return NextResponse.json({
        success: false,
        message: 'Auto retweet is disabled or not configured'
      })
    }

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

    const retweetedIds: string[] = []
    const errors: { tweetId?: string; keyword?: string; error: string }[] = []

    // 各キーワードで検索
    for (const keyword of settings.search_keywords || []) {
      try {
        // 検索クエリを構築
        let searchQuery = keyword
        if (settings.retweet_note_mentions) {
          searchQuery += ' OR note'
        }
        searchQuery += ' -is:retweet' // リツイートは除外

        // ツイートを検索
        const searchResponse = await axios.get(TWITTER_SEARCH_URL, {
          params: {
            query: searchQuery,
            max_results: 10,
            'tweet.fields': 'author_id,created_at,public_metrics'
          },
          headers: {
            'Authorization': `Bearer ${config.bearer_token}`
          }
        })

        const tweets = searchResponse.data.data || []

        for (const tweet of tweets) {
          const { public_metrics, id } = tweet

          // 条件チェック
          if (public_metrics.like_count < (settings.min_likes || 0) ||
              public_metrics.retweet_count < (settings.min_retweets || 0)) {
            continue
          }

          // すでにリツイート済みかチェック（24時間以内）
          const { data: recentRetweet } = await supabase
            .from('x_retweet_history')
            .select('id')
            .eq('tweet_id', id)
            .eq('action', 'retweet')
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .single()

          if (recentRetweet) {
            continue
          }

          // 1日のリツイート上限チェック
          const { count: todayCount } = await supabase
            .from('x_retweet_history')
            .select('*', { count: 'exact', head: true })
            .eq('auto_retweet', true)
            .gte('created_at', new Date().toISOString().split('T')[0])

          // X API Basic tierの制限チェック（1日17件）
          if (todayCount && todayCount >= Math.min(settings.max_retweets_per_day || 10, 17)) {
            console.log('Daily retweet limit reached')
            break
          }

          try {
            // リツイート実行
            await axios.post(
              'https://api.twitter.com/2/users/me/retweets',
              { tweet_id: id },
              {
                headers: {
                  'Authorization': `Bearer ${config.bearer_token}`,
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
                search_query: keyword
              })

            retweetedIds.push(id)

            // レート制限回避のため遅延
            await new Promise(resolve => setTimeout(resolve, 2000))
          } catch (error) {
            const err = error as { response?: { status?: number; data?: unknown }; message?: string }
            if (err.response?.status !== 327) { // 既にリツイート済みエラーは無視
              errors.push({
                tweetId: id,
                error: String(err.response?.data || err.message || 'Unknown error')
              })
            }
          }
        }
      } catch (error) {
        const err = error as { response?: { data?: unknown }; message?: string }
        errors.push({
          keyword,
          error: String(err.response?.data || err.message || 'Unknown error')
        })
      }
    }

    // 最終実行時刻を更新
    await supabase
      .from('x_retweet_settings')
      .update({ updated_at: new Date().toISOString() })
      .single()

    return NextResponse.json({
      success: true,
      retweetedCount: retweetedIds.length,
      retweetedIds,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Auto retweet scheduler error:', error)
    return NextResponse.json(
      { error: 'Failed to process auto retweets' },
      { status: 500 }
    )
  }
}