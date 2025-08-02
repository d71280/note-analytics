import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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
    const supabase = createClient()

    const { data: accounts, error } = await supabase
      .from('x_accounts')
      .select(`
        *,
        x_post_settings!inner(
          post_daily_trends,
          post_featured_articles
        )
      `)

    if (error || !accounts) {
      return NextResponse.json({ error: 'No accounts found' }, { status: 404 })
    }

    const results = []

    for (const account of accounts) {
      const settings = account.x_post_settings[0]
      
      if (type === 'daily_trends' && !settings.post_daily_trends) continue
      if (type === 'featured_articles' && !settings.post_featured_articles) continue

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
              'Authorization': `Bearer ${account.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        )

        const { data: { id: tweetId } } = tweetResponse

        await supabase
          .from('x_post_history')
          .insert({
            x_account_id: account.user_id,
            post_type: type,
            post_content: tweetText,
            tweet_id: tweetId,
            status: 'success'
          })

        await supabase
          .from('x_post_settings')
          .update({ last_posted_at: new Date().toISOString() })
          .eq('x_account_id', account.id)

        results.push({
          account: account.username,
          success: true,
          tweetId
        })
      } catch (error) {
        console.error(`Failed to post for ${account.username}:`, error)
        
        await supabase
          .from('x_post_history')
          .insert({
            x_account_id: account.user_id,
            post_type: type,
            post_content: tweetText,
            status: 'failed'
          })

        results.push({
          account: account.username,
          success: false,
          error: 'Failed to post'
        })
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Auto post error:', error)
    return NextResponse.json(
      { error: 'Failed to process auto post' },
      { status: 500 }
    )
  }
}