// X API設定を環境変数から取得するユーティリティ
export function getXApiConfig() {
  // 複数の環境変数名をサポート（互換性のため）
  const apiKey = process.env.X_API_KEY || process.env.TWITTER_API_KEY
  const apiSecret = process.env.X_API_KEY_SECRET || process.env.X_API_SECRET || process.env.TWITTER_API_KEY_SECRET
  const accessToken = process.env.X_ACCESS_TOKEN || process.env.TWITTER_ACCESS_TOKEN
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET || process.env.TWITTER_ACCESS_TOKEN_SECRET
  const bearerToken = process.env.X_BEARER_TOKEN || process.env.TWITTER_BEARER_TOKEN
  
  // OAuth 1.0a認証を優先（ツイート投稿に必須）
  if (apiKey && apiSecret && accessToken && accessTokenSecret) {
    return {
      api_key: apiKey as string,
      api_key_secret: apiSecret as string,
      access_token: accessToken as string,
      access_token_secret: accessTokenSecret as string,
      bearer_token: bearerToken,
      auth_method: 'oauth1' as const
    }
  }
  
  // Bearer tokenのみ（読み取り専用）
  if (bearerToken) {
    return {
      api_key: '',
      api_key_secret: '',
      access_token: '',
      access_token_secret: '',
      bearer_token: bearerToken,
      auth_method: 'bearer' as const
    }
  }
  
  // どちらの認証情報もない場合
  const missing = []
  if (!apiKey) missing.push('X_API_KEY')
  if (!apiSecret) missing.push('X_API_SECRET')
  if (!accessToken) missing.push('X_ACCESS_TOKEN')
  if (!accessTokenSecret) missing.push('X_ACCESS_TOKEN_SECRET')
  
  
  throw new Error(`X API認証情報が設定されていません。ツイート投稿には以下が必要です: ${missing.join(', ')}`)
}