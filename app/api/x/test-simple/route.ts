import { NextResponse } from 'next/server'
import OAuth from 'oauth-1.0a'
import crypto from 'crypto'
import axios from 'axios'

export async function POST() {
  try {
    // 環境変数から認証情報を取得
    const apiKey = process.env.X_API_KEY
    const apiSecret = process.env.X_API_SECRET
    const accessToken = process.env.X_ACCESS_TOKEN
    const accessSecret = process.env.X_ACCESS_TOKEN_SECRET
    
    if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
      return NextResponse.json({
        success: false,
        error: 'Missing credentials',
        details: {
          hasApiKey: !!apiKey,
          hasApiSecret: !!apiSecret,
          hasAccessToken: !!accessToken,
          hasAccessSecret: !!accessSecret
        }
      }, { status: 400 })
    }

    // OAuth 1.0a設定
    const oauth = new OAuth({
      consumer: {
        key: apiKey,
        secret: apiSecret
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
      key: accessToken,
      secret: accessSecret,
    }

    // シンプルなテストツイート
    const tweetText = `テスト投稿 ${new Date().toLocaleString('ja-JP')}`
    
    const formData = new URLSearchParams()
    formData.append('status', tweetText)

    const requestData = {
      url: 'https://api.twitter.com/1.1/statuses/update.json',
      method: 'POST',
      data: Object.fromEntries(formData.entries()),
    }

    // ツイートを投稿
    const response = await axios.post(
      requestData.url,
      formData.toString(),
      {
        headers: {
          ...oauth.toHeader(oauth.authorize(requestData, token)),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )

    return NextResponse.json({
      success: true,
      tweetId: response.data.id_str,
      text: response.data.text,
      url: `https://twitter.com/user/status/${response.data.id_str}`
    })
    
  } catch (error) {
    console.error('Test tweet error:', error)
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const data = error.response?.data
      
      let message = 'ツイート投稿に失敗しました'
      let suggestion = ''
      
      if (status === 401) {
        message = 'アクセストークンが無効または期限切れです'
        suggestion = 'X Developer Portalで新しいAccess TokenとSecretを生成してください'
      } else if (status === 403) {
        message = 'アプリの権限が不足しています'
        suggestion = 'X Developer PortalでアプリにRead and Write権限を付与してください'
      } else if (status === 429) {
        message = 'レート制限に達しました'
        suggestion = '15分後に再試行してください'
      }
      
      return NextResponse.json({
        success: false,
        error: message,
        suggestion,
        status,
        details: data
      }, { status: status || 500 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Unknown error occurred',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 })
  }
}