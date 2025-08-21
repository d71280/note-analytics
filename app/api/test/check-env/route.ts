import { NextResponse } from 'next/server'

export async function GET() {
  const envCheck = {
    X_API_KEY: process.env.X_API_KEY ? '✅ 設定済み' : '❌ 未設定',
    X_API_SECRET: process.env.X_API_SECRET ? '✅ 設定済み' : '❌ 未設定',
    X_API_KEY_SECRET: process.env.X_API_KEY_SECRET ? '✅ 設定済み' : '❌ 未設定',
    X_ACCESS_TOKEN: process.env.X_ACCESS_TOKEN ? '✅ 設定済み' : '❌ 未設定',
    X_ACCESS_TOKEN_SECRET: process.env.X_ACCESS_TOKEN_SECRET ? '✅ 設定済み' : '❌ 未設定',
    X_BEARER_TOKEN: process.env.X_BEARER_TOKEN ? '✅ 設定済み' : '❌ 未設定',
    
    // 古い環境変数名もチェック
    TWITTER_API_KEY: process.env.TWITTER_API_KEY ? '✅ 設定済み' : '❌ 未設定',
    TWITTER_API_KEY_SECRET: process.env.TWITTER_API_KEY_SECRET ? '✅ 設定済み' : '❌ 未設定',
    TWITTER_ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN ? '✅ 設定済み' : '❌ 未設定',
    TWITTER_ACCESS_TOKEN_SECRET: process.env.TWITTER_ACCESS_TOKEN_SECRET ? '✅ 設定済み' : '❌ 未設定',
    TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN ? '✅ 設定済み' : '❌ 未設定',
  }
  
  // getXApiConfigの結果も確認
  let configResult = null
  try {
    const { getXApiConfig } = await import('@/lib/x-api/config')
    const config = getXApiConfig()
    configResult = {
      auth_method: config.auth_method,
      has_api_key: !!config.api_key,
      has_api_secret: !!config.api_key_secret,
      has_access_token: !!config.access_token,
      has_access_token_secret: !!config.access_token_secret,
      has_bearer_token: !!config.bearer_token,
    }
  } catch (error) {
    configResult = {
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
  
  return NextResponse.json({
    env_vars: envCheck,
    config_result: configResult,
    note: 'OAuth 1.0a認証にはX_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRETの4つすべてが必要です'
  })
}