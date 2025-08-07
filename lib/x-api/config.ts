// X API設定を環境変数から取得するユーティリティ
export function getXApiConfig() {
  const apiKey = process.env.X_API_KEY
  const apiSecret = process.env.X_API_SECRET || process.env.X_API_KEY_SECRET
  const accessToken = process.env.X_ACCESS_TOKEN
  const accessTokenSecret = process.env.X_ACCESS_SECRET
  const bearerToken = process.env.X_BEARER_TOKEN
  
  // Bearer token認証（X API v2推奨）
  if (bearerToken) {
    return {
      api_key: apiKey,
      api_key_secret: apiSecret,
      access_token: accessToken,
      access_token_secret: accessTokenSecret,
      bearer_token: bearerToken,
      auth_method: 'bearer' as const
    }
  }
  
  // OAuth 1.0a認証（フォールバック）
  const missing = []
  if (!apiKey) missing.push('X_API_KEY')
  if (!apiSecret) missing.push('X_API_SECRET or X_API_KEY_SECRET')
  if (!accessToken) missing.push('X_ACCESS_TOKEN')
  if (!accessTokenSecret) missing.push('X_ACCESS_SECRET')
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}. For better compatibility, consider using X_BEARER_TOKEN instead.`)
  }
  
  return {
    api_key: apiKey as string,
    api_key_secret: apiSecret as string,
    access_token: accessToken as string,
    access_token_secret: accessTokenSecret as string,
    bearer_token: undefined,
    auth_method: 'oauth1' as const
  }
}