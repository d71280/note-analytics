import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getXApiConfig } from '@/lib/x-api/config'
import OAuth from 'oauth-1.0a'
import crypto from 'crypto'
import axios from 'axios'

const TWITTER_API_URL = 'https://api.twitter.com/2/tweets'

export async function POST(request: NextRequest) {
  let tweetText = ''
  let postType = 'manual'
  let replyToId = undefined
  
  try {
    const body = await request.json()
    tweetText = body.text || body.content // textまたはcontentを受け付ける
    postType = body.postType || 'manual'
    replyToId = body.replyToId

    if (!tweetText || tweetText.length > 280) {
      return NextResponse.json(
        { error: 'Invalid tweet text' },
        { status: 400 }
      )
    }

    // 環境変数からX API設定を取得
    let config
    try {
      config = getXApiConfig()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('X API config error:', errorMessage)
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )
    }

    // ツイートデータを構築
    const tweetData: { text: string; reply?: { in_reply_to_tweet_id: string } } = { 
      text: tweetText 
    }
    
    // 返信の場合
    if (replyToId) {
      tweetData.reply = {
        in_reply_to_tweet_id: replyToId
      }
    }

    let tweetResponse

    // Bearer token認証を使用（X API v2推奨）
    if (config.auth_method === 'bearer' && config.bearer_token) {
      console.log('Using Bearer token authentication for X API v2')
      tweetResponse = await axios.post(
        TWITTER_API_URL,
        tweetData,
        {
          headers: {
            'Authorization': `Bearer ${config.bearer_token}`,
            'Content-Type': 'application/json'
          }
        }
      )
    } else {
      // OAuth 1.0a署名を生成（フォールバック）
      console.log('Using OAuth 1.0a authentication (fallback)')
      
      if (!config.api_key || !config.api_key_secret || !config.access_token || !config.access_token_secret) {
        return NextResponse.json(
          { 
            error: 'OAuth credentials not properly configured',
            suggestion: 'Please set X_BEARER_TOKEN for easier authentication'
          },
          { status: 500 }
        )
      }
      
      const oauth = new OAuth({
        consumer: {
          key: config.api_key as string,
          secret: config.api_key_secret as string
        },
        signature_method: 'HMAC-SHA1',
        hash_function(base_string, key) {
          return crypto
            .createHmac('sha1', key)
            .update(base_string)
            .digest('base64')
        },
      })

      const token = {
        key: config.access_token as string,
        secret: config.access_token_secret as string,
      }

      const requestData = {
        url: TWITTER_API_URL,
        method: 'POST',
        data: tweetData,
      }

      // ツイートを投稿
      tweetResponse = await axios.post(
        TWITTER_API_URL,
        tweetData,
        {
          headers: {
            ...oauth.toHeader(oauth.authorize(requestData, token)),
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const { data: { id: tweetId } } = tweetResponse

    // 投稿履歴を保存（オプション）
    try {
      const supabase = createClient()
      await supabase
        .from('x_post_history')
        .insert({
          post_type: postType || 'manual',
          post_content: tweetText,
          tweet_id: tweetId,
          reply_to_id: replyToId,
          status: 'success'
        })
    } catch {
      // 履歴の保存に失敗しても無視
    }

    return NextResponse.json({ 
      success: true, 
      tweetId,
      url: `https://twitter.com/i/web/status/${tweetId}`
    })
  } catch (error) {
    console.error('Tweet error:', error)
    
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
            message: 'X API認証に失敗しました。Bearer token (X_BEARER_TOKEN) を設定するか、Access token (X_ACCESS_TOKEN/X_ACCESS_SECRET) を再生成してください。' 
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

    // エラー履歴を保存（オプション）
    if (tweetText) {
      try {
        const supabase = createClient()
        await supabase
          .from('x_post_history')
          .insert({
            post_type: postType || 'manual',
            post_content: tweetText,
            reply_to_id: replyToId,
            status: 'failed'
          })
      } catch {
        // エラー履歴の保存に失敗しても無視
      }
    }

    return NextResponse.json(
      { error: 'Failed to post tweet' },
      { status: 500 }
    )
  }
}