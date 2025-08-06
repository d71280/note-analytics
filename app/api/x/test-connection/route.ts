import { NextResponse } from 'next/server'
import OAuth from 'oauth-1.0a'
import crypto from 'crypto'

export async function POST() {
  try {
    // 環境変数から直接X API設定を取得
    const apiKey = process.env.X_API_KEY
    const apiSecret = process.env.X_API_SECRET || process.env.X_API_KEY_SECRET
    const accessToken = process.env.X_ACCESS_TOKEN
    const accessTokenSecret = process.env.X_ACCESS_SECRET
    
    if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
      return NextResponse.json(
        { error: 'X API credentials not configured in environment variables' },
        { status: 400 }
      )
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
      }
    })
    
    const token = {
      key: accessToken,
      secret: accessTokenSecret
    }
    
    // APIリクエストの準備
    const url = 'https://api.twitter.com/2/users/me'
    const request_data = {
      url: url,
      method: 'GET'
    }
    
    // OAuth署名を生成
    const headers = oauth.toHeader(oauth.authorize(request_data, token))
    
    // Twitter API v2でユーザー情報を取得してテスト
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('X API connection test failed:', errorText)
      
      // よくあるエラーの詳細なメッセージ
      let errorMessage = 'X API connection failed'
      if (response.status === 401) {
        errorMessage = '認証に失敗しました。APIキーとトークンを確認してください。'
      } else if (response.status === 403) {
        errorMessage = 'アクセスが拒否されました。APIの権限を確認してください。'
      } else if (response.status === 429) {
        errorMessage = 'レート制限に達しました。しばらく待ってから再試行してください。'
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorText,
          status: response.status
        },
        { status: 400 }
      )
    }
    
    const userData = await response.json()
    
    return NextResponse.json({
      success: true,
      message: 'X API connection successful',
      user: userData.data
    })
    
  } catch (error) {
    console.error('X API test connection error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to test X API connection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}