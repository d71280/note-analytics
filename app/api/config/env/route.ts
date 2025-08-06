import { NextResponse } from 'next/server'

export async function GET() {
  // セキュリティのため、マスクされた値を返す
  const xApiKey = process.env.X_API_KEY || ''
  const xApiSecret = process.env.X_API_SECRET || process.env.X_API_KEY_SECRET || ''
  const xAccessToken = process.env.X_ACCESS_TOKEN || ''
  const xAccessSecret = process.env.X_ACCESS_SECRET || ''
  const grokApiKey = process.env.GROK_API_KEY || ''

  // API情報が設定されているかチェック
  const hasXConfig = !!(xApiKey && xApiSecret && xAccessToken && xAccessSecret)
  const hasGrokConfig = !!grokApiKey

  return NextResponse.json({
    x: {
      configured: hasXConfig,
      // 最初の4文字と最後の4文字のみ表示
      api_key: hasXConfig && xApiKey ? `${xApiKey.substring(0, 4)}...${xApiKey.slice(-4)}` : '',
      api_secret: hasXConfig && xApiSecret ? `${xApiSecret.substring(0, 4)}...${xApiSecret.slice(-4)}` : '',
      access_token: hasXConfig && xAccessToken ? `${xAccessToken.substring(0, 4)}...${xAccessToken.slice(-4)}` : '',
      access_token_secret: hasXConfig && xAccessSecret ? `${xAccessSecret.substring(0, 4)}...${xAccessSecret.slice(-4)}` : ''
    },
    grok: {
      configured: hasGrokConfig,
      api_key: hasGrokConfig && grokApiKey ? `${grokApiKey.substring(0, 4)}...${grokApiKey.slice(-4)}` : ''
    }
  })
}