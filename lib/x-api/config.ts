// X API設定を環境変数から取得するユーティリティ
export function getXApiConfig() {
  const apiKey = process.env.X_API_KEY
  const apiSecret = process.env.X_API_SECRET || process.env.X_API_KEY_SECRET
  const accessToken = process.env.X_ACCESS_TOKEN
  const accessTokenSecret = process.env.X_ACCESS_SECRET
  
  const missing = []
  if (!apiKey) missing.push('X_API_KEY')
  if (!apiSecret) missing.push('X_API_SECRET or X_API_KEY_SECRET')
  if (!accessToken) missing.push('X_ACCESS_TOKEN')
  if (!accessTokenSecret) missing.push('X_ACCESS_SECRET')
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`)
  }
  
  return {
    api_key: apiKey as string,
    api_key_secret: apiSecret as string,
    access_token: accessToken as string,
    access_token_secret: accessTokenSecret as string,
    bearer_token: accessToken as string // Twitter API v2ではaccess_tokenをbearer_tokenとして使用
  }
}