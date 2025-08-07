import { NextResponse } from 'next/server'
import { getXApiConfig } from '@/lib/x-api/config'
import OAuth from 'oauth-1.0a'
import crypto from 'crypto'
import axios from 'axios'

export async function GET() {
  try {
    const config = getXApiConfig()
    
    // 設定状況を確認
    const configStatus = {
      hasApiKey: !!config.api_key,
      hasApiSecret: !!config.api_key_secret,
      hasAccessToken: !!config.access_token,
      hasAccessSecret: !!config.access_token_secret,
      hasBearerToken: !!config.bearer_token,
      authMethod: config.auth_method
    }
    
    // OAuth 1.0aで認証確認
    if (config.api_key && config.api_key_secret && config.access_token && config.access_token_secret) {
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

      // ユーザー情報を取得してトークンの有効性を確認
      const requestData = {
        url: 'https://api.twitter.com/1.1/account/verify_credentials.json',
        method: 'GET',
      }

      try {
        const response = await axios.get(
          requestData.url,
          {
            headers: oauth.toHeader(oauth.authorize(requestData, token))
          }
        )
        
        return NextResponse.json({
          authenticated: true,
          user: {
            id: response.data.id_str,
            screen_name: response.data.screen_name,
            name: response.data.name
          },
          config: configStatus,
          message: '認証成功: アカウントに正常にアクセスできます'
        })
      } catch (error) {
        if (axios.isAxiosError(error)) {
          return NextResponse.json({
            authenticated: false,
            config: configStatus,
            error: error.response?.data,
            status: error.response?.status,
            message: error.response?.status === 403 
              ? 'アプリの権限不足: X Developer PortalでRead and Write権限を有効にしてください'
              : 'トークンが無効または期限切れです'
          }, { status: 401 })
        }
        throw error
      }
    }
    
    return NextResponse.json({
      authenticated: false,
      config: configStatus,
      message: 'OAuth 1.0a認証情報が不完全です'
    }, { status: 400 })
    
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check authentication',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}