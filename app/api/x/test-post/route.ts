import { NextRequest, NextResponse } from 'next/server'
import { getXApiConfig } from '@/lib/x-api/config'
import OAuth from 'oauth-1.0a'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const testText = body.text || 'Test tweet from Note Analytics Platform'

    // 環境変数から設定を取得
    let config
    try {
      config = getXApiConfig()
      console.log('Config loaded successfully')
      console.log('API Key exists:', !!config.api_key)
      console.log('API Secret exists:', !!config.api_key_secret)
      console.log('Access Token exists:', !!config.access_token)
      console.log('Access Token Secret exists:', !!config.access_token_secret)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return NextResponse.json({ error: errorMessage }, { status: 500 })
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

    // まず認証をテスト
    const verifyUrl = 'https://api.twitter.com/1.1/account/verify_credentials.json'
    const verifyRequest = {
      url: verifyUrl,
      method: 'GET',
    }

    const verifyHeaders = oauth.toHeader(oauth.authorize(verifyRequest, token))
    console.log('Verify headers:', Object.keys(verifyHeaders))

    // 認証確認
    const verifyResponse = await fetch(verifyUrl, {
      method: 'GET',
      headers: verifyHeaders as HeadersInit,
    })

    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text()
      console.error('Verify credentials failed:', verifyResponse.status, errorText)
      return NextResponse.json({
        error: 'Authentication failed',
        status: verifyResponse.status,
        details: errorText
      }, { status: 401 })
    }

    const credentials = await verifyResponse.json()
    console.log('Authenticated as:', credentials.screen_name)

    // ツイート投稿
    const tweetUrl = 'https://api.twitter.com/2/tweets'
    const tweetData = { text: testText }
    
    const requestData = {
      url: tweetUrl,
      method: 'POST',
      data: tweetData,
    }

    const authHeader = oauth.toHeader(oauth.authorize(requestData, token))
    
    const tweetResponse = await fetch(tweetUrl, {
      method: 'POST',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      } as HeadersInit,
      body: JSON.stringify(tweetData),
    })

    if (!tweetResponse.ok) {
      const errorText = await tweetResponse.text()
      console.error('Tweet failed:', tweetResponse.status, errorText)
      return NextResponse.json({
        error: 'Failed to post tweet',
        status: tweetResponse.status,
        details: errorText
      }, { status: tweetResponse.status })
    }

    const result = await tweetResponse.json()
    
    return NextResponse.json({
      success: true,
      tweetId: result.data?.id,
      user: credentials.screen_name,
      message: 'Test tweet posted successfully'
    })
  } catch (error) {
    console.error('Test post error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}