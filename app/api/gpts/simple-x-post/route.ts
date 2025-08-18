import { NextRequest, NextResponse } from 'next/server'
import { getXApiConfig } from '@/lib/x-api/config'
import OAuth from 'oauth-1.0a'
import crypto from 'crypto'
import axios from 'axios'

const TWITTER_API_URL = 'https://api.twitter.com/2/tweets'

// 超シンプルなGETエンドポイント（テスト用）
export async function GET(request: NextRequest) {
  // クエリパラメータから投稿内容を取得
  const searchParams = request.nextUrl.searchParams
  const text = searchParams.get('text')
  
  // テストモードの場合
  if (!text || text === 'test') {
    return NextResponse.json({
      status: 'ready',
      message: 'X API is ready to post',
      endpoint: '/api/gpts/simple-x-post',
      method: 'GET with ?text=your_message'
    })
  }
  
  try {
    // 文字数チェック
    if (text.length > 280) {
      return NextResponse.json({
        error: 'Text too long',
        maxLength: 280,
        currentLength: text.length
      })
    }
    
    // X API設定を取得
    const config = getXApiConfig()
    
    // OAuth 1.0a設定
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
      },
    })
    
    const token = {
      key: config.access_token,
      secret: config.access_token_secret,
    }
    
    const requestData = {
      url: TWITTER_API_URL,
      method: 'POST',
    }
    
    // X APIにポスト
    const response = await axios.post(
      TWITTER_API_URL,
      { text },
      {
        headers: {
          ...oauth.toHeader(oauth.authorize(requestData, token)),
          'Content-Type': 'application/json'
        }
      }
    )
    
    const tweetId = response.data.data?.id
    
    return NextResponse.json({
      success: true,
      tweetId,
      url: `https://twitter.com/user/status/${tweetId}`,
      message: 'Posted successfully!'
    })
    
  } catch (error) {
    console.error('X Post Error:', error)
    
    // 設定エラーの場合
    if (error instanceof Error && error.message.includes('X API認証情報')) {
      return NextResponse.json({
        error: 'X API not configured',
        message: 'Please set X API credentials in Vercel environment variables'
      })
    }
    
    // APIエラーの場合
    if (axios.isAxiosError(error)) {
      return NextResponse.json({
        error: 'X API Error',
        status: error.response?.status,
        message: error.response?.data?.detail || 'Failed to post'
      })
    }
    
    return NextResponse.json({
      error: 'Unknown error',
      message: 'Failed to post to X'
    })
  }
}