import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getXApiConfig } from '@/lib/x-api/config'
import OAuth from 'oauth-1.0a'
import crypto from 'crypto'
import axios from 'axios'

// X API v2を使用（Free tierではv1.1にアクセスできない）
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

    if (!tweetText) {
      return NextResponse.json(
        { error: 'Tweet text is required' },
        { status: 400 }
      )
    }
    
    // 文字数チェック（無料アカウントは280文字まで）
    if (tweetText.length > 280) {
      console.log(`Tweet too long: ${tweetText.length} characters`)
      return NextResponse.json(
        { 
          error: 'ツイートが長すぎます',
          length: tweetText.length,
          limit: 280,
          text: tweetText.substring(0, 100) + '...'
        },
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

    // ツイートデータを構築（v2 API形式）
    const tweetData: { text: string; reply?: { in_reply_to_tweet_id: string } } = { 
      text: tweetText 
    }
    
    // 返信の場合
    if (replyToId) {
      tweetData.reply = { in_reply_to_tweet_id: replyToId }
    }

    let tweetResponse

    // ツイート投稿はOAuth 1.0aが必須（Bearer Tokenはサポートされていない）
    // X API v2の/2/tweetsエンドポイントはユーザーコンテキストが必要
    if (config.api_key && config.api_key_secret && config.access_token && config.access_token_secret) {
      console.log('Using OAuth 1.0a authentication for tweet posting')
      
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
      }

      // ツイートを投稿（v2 API形式）
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
    } else {
      // OAuth 1.0a認証情報が不足
      return NextResponse.json(
        { 
          error: 'ツイート投稿にはOAuth 1.0a認証が必要です',
          details: 'X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRETの4つすべてを設定してください',
          note: 'Bearer Tokenはツイート投稿をサポートしていません（読み取り専用）'
        },
        { status: 401 }
      )
    }

    // v2 APIのレスポンス形式
    const { data } = tweetResponse
    const tweetId = data.data?.id

    // 投稿履歴を保存（オプション）
    try {
      const supabase = createAdminClient()
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
      url: `https://twitter.com/user/status/${tweetId}`
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
      } else if (error.response?.status === 403) {
        // エラーコード453の場合（Free tier制限）
        if (error.response?.data?.errors?.[0]?.code === 453) {
          return NextResponse.json(
            { 
              error: 'Free tierの制限', 
              details: error.response?.data,
              message: 'Free tierではX API v1.1へのアクセスが制限されています。',
              suggestion: 'X API v2を使用しています。権限設定を確認してください。'
            },
            { status: 403 }
          )
        }
        return NextResponse.json(
          { 
            error: 'Forbidden - Access denied', 
            details: error.response?.data,
            message: 'X APIへのアクセスが拒否されました。アプリの権限設定を確認し、Read and Write権限があることを確認してください。',
            suggestion: 'X Developer Portalでアプリの設定を確認し、User authentication settingsでRead and Write権限を有効にしてください。'
          },
          { status: 403 }
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
        const supabase = createAdminClient()
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