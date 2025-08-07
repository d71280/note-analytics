import { NextResponse } from 'next/server'
import { getXApiConfig } from '@/lib/x-api/config'
import OAuth from 'oauth-1.0a'
import crypto from 'crypto'

export async function POST() {
  try {
    // X API設定を取得
    let config
    try {
      config = getXApiConfig()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }
    
    const url = 'https://api.twitter.com/2/users/me'
    let response

    // Bearer token認証を使用（X API v2推奨）
    if (config.auth_method === 'bearer' && config.bearer_token) {
      console.log('Testing X API connection with Bearer token authentication')
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.bearer_token}`,
          'Content-Type': 'application/json'
        }
      })
    } else {
      // OAuth 1.0a設定（フォールバック）
      console.log('Testing X API connection with OAuth 1.0a authentication')
      const oauth = new OAuth({
        consumer: {
          key: config.api_key,
          secret: config.api_key_secret
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
        key: config.access_token,
        secret: config.access_token_secret
      }
      
      // APIリクエストの準備
      const request_data = {
        url: url,
        method: 'GET'
      }
      
      // OAuth署名を生成
      const headers = oauth.toHeader(oauth.authorize(request_data, token))
      
      // Twitter API v2でユーザー情報を取得してテスト
      response = await fetch(url, {
        method: 'GET',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        }
      })
    }
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('X API connection test failed:', errorText)
      
      // よくあるエラーの詳細なメッセージ
      let errorMessage = 'X API connection failed'
      if (response.status === 401) {
        errorMessage = config.auth_method === 'bearer' 
          ? '認証に失敗しました。Bearer token (X_BEARER_TOKEN) を確認してください。'
          : '認証に失敗しました。Access token (X_ACCESS_TOKEN/X_ACCESS_SECRET) を再生成するか、Bearer token (X_BEARER_TOKEN) を設定してください。'
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
      message: `X API connection successful using ${config.auth_method === 'bearer' ? 'Bearer token' : 'OAuth 1.0a'} authentication`,
      user: userData.data,
      auth_method: config.auth_method
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