import { NextResponse } from 'next/server'
import OAuth from 'oauth-1.0a'
import crypto from 'crypto'
import axios from 'axios'

export async function GET() {
  try {
    // 環境変数を取得
    const apiKey = process.env.X_API_KEY || process.env.TWITTER_API_KEY
    const apiSecret = process.env.X_API_SECRET || process.env.X_API_KEY_SECRET
    const accessToken = process.env.X_ACCESS_TOKEN || process.env.TWITTER_ACCESS_TOKEN
    const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET || process.env.TWITTER_ACCESS_TOKEN_SECRET
    
    if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
      return NextResponse.json({
        error: '認証情報が不足しています',
        hasApiKey: !!apiKey,
        hasApiSecret: !!apiSecret,
        hasAccessToken: !!accessToken,
        hasAccessTokenSecret: !!accessTokenSecret
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
    
    // ユーザー情報を取得してトークンを検証
    const requestData = {
      url: 'https://api.twitter.com/2/users/me',
      method: 'GET',
    }
    
    try {
      const response = await axios.get(
        'https://api.twitter.com/2/users/me',
        {
          headers: {
            ...oauth.toHeader(oauth.authorize(requestData, token))
          }
        }
      )
      
      return NextResponse.json({
        success: true,
        message: 'X API認証成功！',
        user: response.data.data,
        note: 'アクセストークンは有効です。投稿も可能なはずです。'
      })
    } catch (apiError) {
      if (axios.isAxiosError(apiError)) {
        return NextResponse.json({
          error: 'X API認証失敗',
          status: apiError.response?.status,
          message: apiError.response?.data,
          suggestion: apiError.response?.status === 401 
            ? 'アクセストークンが無効です。X Developer Portalで再生成してください。'
            : 'APIエラーが発生しました。'
        }, { status: apiError.response?.status || 500 })
      }
      throw apiError
    }
    
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json({
      error: 'エラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}