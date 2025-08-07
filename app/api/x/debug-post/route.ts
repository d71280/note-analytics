import { NextRequest, NextResponse } from 'next/server'
import { getXApiConfig } from '@/lib/x-api/config'
import OAuth from 'oauth-1.0a'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const testText = body.text || 'Test tweet from Note Analytics ' + new Date().toISOString()

    // 環境変数の確認
    console.log('Environment check:')
    console.log('X_API_KEY exists:', !!process.env.X_API_KEY)
    console.log('X_API_SECRET exists:', !!process.env.X_API_SECRET)
    console.log('X_API_KEY_SECRET exists:', !!process.env.X_API_KEY_SECRET)
    console.log('X_ACCESS_TOKEN exists:', !!process.env.X_ACCESS_TOKEN)
    console.log('X_ACCESS_SECRET exists:', !!process.env.X_ACCESS_SECRET)

    // 設定を取得
    let config
    try {
      config = getXApiConfig()
    } catch (error) {
      return NextResponse.json({
        error: 'Configuration error',
        details: error instanceof Error ? error.message : 'Unknown error',
        env: {
          hasApiKey: !!process.env.X_API_KEY,
          hasApiSecret: !!process.env.X_API_SECRET || !!process.env.X_API_KEY_SECRET,
          hasAccessToken: !!process.env.X_ACCESS_TOKEN,
          hasAccessSecret: !!process.env.X_ACCESS_SECRET,
        }
      }, { status: 500 })
    }

    // OAuth 1.0a設定
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

    // 1. まずユーザー認証を確認（v1.1 API）
    const verifyUrl = 'https://api.twitter.com/1.1/account/verify_credentials.json'
    const verifyRequest = {
      url: verifyUrl,
      method: 'GET',
    }

    const verifyHeaders = oauth.toHeader(oauth.authorize(verifyRequest, token))
    
    const verifyResponse = await fetch(verifyUrl, {
      method: 'GET',
      headers: verifyHeaders as HeadersInit,
    })

    const verifyText = await verifyResponse.text()
    
    if (!verifyResponse.ok) {
      return NextResponse.json({
        error: 'Authentication verification failed',
        status: verifyResponse.status,
        details: verifyText,
        suggestion: 'Access Tokenを再生成してください',
        debug: {
          authMethod: config.auth_method,
          hasCredentials: {
            apiKey: !!config.api_key,
            apiSecret: !!config.api_key_secret,
            accessToken: !!config.access_token,
            accessSecret: !!config.access_token_secret,
          }
        }
      }, { status: 401 })
    }

    const userData = JSON.parse(verifyText)
    
    // 2. ツイート投稿を試みる（v2 API）
    const tweetUrl = 'https://api.twitter.com/2/tweets'
    const tweetData = { text: testText }
    
    const tweetRequest = {
      url: tweetUrl,
      method: 'POST',
      data: tweetData,
    }

    const tweetHeaders = oauth.toHeader(oauth.authorize(tweetRequest, token))
    
    const tweetResponse = await fetch(tweetUrl, {
      method: 'POST',
      headers: {
        ...tweetHeaders,
        'Content-Type': 'application/json',
      } as HeadersInit,
      body: JSON.stringify(tweetData),
    })

    const tweetText = await tweetResponse.text()
    
    if (!tweetResponse.ok) {
      return NextResponse.json({
        error: 'Tweet posting failed',
        status: tweetResponse.status,
        details: tweetText,
        userInfo: {
          screen_name: userData.screen_name,
          name: userData.name,
          verified: userData.verified,
        },
        suggestion: tweetResponse.status === 403 
          ? 'アプリの権限が"Read and write"になっているか確認してください' 
          : 'Access Tokenを再生成してください'
      }, { status: tweetResponse.status })
    }

    const tweetResult = JSON.parse(tweetText)
    
    return NextResponse.json({
      success: true,
      tweet: {
        id: tweetResult.data?.id,
        text: tweetResult.data?.text,
      },
      user: {
        screen_name: userData.screen_name,
        name: userData.name,
      },
      message: 'Tweet posted successfully!'
    })

  } catch (error) {
    console.error('Debug post error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}