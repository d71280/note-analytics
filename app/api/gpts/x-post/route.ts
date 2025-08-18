import { NextRequest, NextResponse } from 'next/server'
import { getXApiConfig } from '@/lib/x-api/config'
import OAuth from 'oauth-1.0a'
import crypto from 'crypto'
import axios from 'axios'

const TWITTER_API_URL = 'https://api.twitter.com/2/tweets'

// CORS設定
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, openai-conversation-id, openai-ephemeral-user-id',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json',
  }
}

// OPTIONS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  })
}

// GET - 接続テスト用エンドポイント
export async function GET(request: NextRequest) {
  console.log('=== GPTs X Connection Test ===')
  
  const searchParams = request.nextUrl.searchParams
  const test = searchParams.get('test')
  
  // X API設定の確認（認証情報は表示しない）
  let hasXConfig = false
  let configStatus = 'Not configured'
  
  try {
    const config = getXApiConfig()
    if (config.api_key && config.access_token) {
      hasXConfig = true
      configStatus = 'OAuth 1.0a configured'
    }
  } catch {
    configStatus = 'Missing X API credentials'
  }
  
  // GPTs API キーの確認
  const hasGPTsKey = !!process.env.GPTS_API_KEY
  
  return NextResponse.json({
    success: true,
    message: 'Connection test successful',
    timestamp: new Date().toISOString(),
    configuration: {
      xApi: configStatus,
      hasXCredentials: hasXConfig,
      gptsAuth: hasGPTsKey ? 'Enabled' : 'Disabled (open access)',
      endpoint: '/api/gpts/x-post',
      method: 'POST',
      maxLength: 280
    },
    testParameter: test || 'none',
    ready: hasXConfig
  }, {
    headers: getCorsHeaders()
  })
}

// GPTs認証（オプション）
function authenticateGPTs(request: NextRequest): boolean {
  const gptsApiKey = process.env.GPTS_API_KEY
  if (!gptsApiKey) {
    // 認証キーが設定されていない場合は認証をスキップ
    return true
  }
  
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false
  }
  
  const token = authHeader.slice(7)
  return token === gptsApiKey
}

// X投稿エンドポイント（GPTs用）
export async function POST(request: NextRequest) {
  console.log('=== GPTs X Post Request ===')
  
  // 認証チェック
  if (!authenticateGPTs(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: getCorsHeaders() }
    )
  }
  
  try {
    const body = await request.json()
    const { text, replyToId } = body
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400, headers: getCorsHeaders() }
      )
    }
    
    // 文字数チェック
    if (text.length > 280) {
      return NextResponse.json(
        { 
          error: 'Text too long',
          maxLength: 280,
          currentLength: text.length
        },
        { status: 400, headers: getCorsHeaders() }
      )
    }
    
    // X API設定を取得
    let config
    try {
      config = getXApiConfig()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'X API configuration error'
      console.error('X API config error:', errorMessage)
      return NextResponse.json(
        { error: errorMessage },
        { status: 500, headers: getCorsHeaders() }
      )
    }
    
    // OAuth 1.0a認証が必要
    if (!config.api_key || !config.api_key_secret || !config.access_token || !config.access_token_secret) {
      return NextResponse.json(
        { 
          error: 'X API OAuth credentials not configured',
          details: 'Please set X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, and X_ACCESS_TOKEN_SECRET'
        },
        { status: 500, headers: getCorsHeaders() }
      )
    }
    
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
    
    // ツイートデータ
    const tweetData: { text: string; reply?: { in_reply_to_tweet_id: string } } = { 
      text 
    }
    
    if (replyToId) {
      tweetData.reply = { in_reply_to_tweet_id: replyToId }
    }
    
    // X APIにポスト
    const response = await axios.post(
      TWITTER_API_URL,
      tweetData,
      {
        headers: {
          ...oauth.toHeader(oauth.authorize(requestData, token)),
          'Content-Type': 'application/json'
        }
      }
    )
    
    const { data } = response
    const tweetId = data.data?.id
    
    return NextResponse.json({
      success: true,
      tweetId,
      url: `https://twitter.com/user/status/${tweetId}`,
      message: 'Tweet posted successfully'
    }, {
      headers: getCorsHeaders()
    })
    
  } catch (error) {
    console.error('X Post Error:', error)
    
    if (axios.isAxiosError(error)) {
      const errorResponse = error.response?.data
      const status = error.response?.status || 500
      
      return NextResponse.json(
        { 
          error: 'X API Error',
          details: errorResponse,
          status
        },
        { status, headers: getCorsHeaders() }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}