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
    const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET
    
    if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
      return NextResponse.json({
        success: false,
        error: 'Missing credentials',
        details: {
          hasApiKey: !!apiKey,
          hasApiSecret: !!apiSecret,
          hasAccessToken: !!accessToken,
          hasAccessTokenSecret: !!accessTokenSecret
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
      secret: accessTokenSecret,
    }

    // X API v2 エンドポイントを使用
    const tweetText = `テスト投稿 ${new Date().toLocaleString('ja-JP')}`
    
    const requestData = {
      url: 'https://api.twitter.com/2/tweets',
      method: 'POST',
    }

    // ツイートを投稿（v2形式）
    const response = await axios.post(
      requestData.url,
      {
        text: tweetText
      },
      {
        headers: {
          ...oauth.toHeader(oauth.authorize(requestData, token)),
          'Content-Type': 'application/json'
        }
      }
    )

    return NextResponse.json({
      success: true,
      tweetId: response.data.data?.id,
      text: response.data.data?.text,
      url: response.data.data?.id ? `https://twitter.com/user/status/${response.data.data.id}` : undefined
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
        
        // エラーコード453の場合
        if (data?.errors?.[0]?.code === 453) {
          message = 'Free tierの制限です'
          suggestion = 'X API v2のツイート投稿エンドポイントを使用してください'
        }
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