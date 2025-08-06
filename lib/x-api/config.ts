// X API設定を環境変数から取得するユーティリティ
export function getXApiConfig() {
  const apiKey = process.env.X_API_KEY
  const apiSecret = process.env.X_API_SECRET || process.env.X_API_KEY_SECRET
  const accessToken = process.env.X_ACCESS_TOKEN
  const accessTokenSecret = process.env.X_ACCESS_SECRET
  
  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    throw new Error('X API credentials not configured in environment variables')
  }
  
  return {
    api_key: apiKey,
    api_key_secret: apiSecret,
    access_token: accessToken,
    access_token_secret: accessTokenSecret,
    bearer_token: accessToken // Twitter API v2ではaccess_tokenをbearer_tokenとして使用
  }
}