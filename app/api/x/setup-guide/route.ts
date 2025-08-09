import { NextResponse } from 'next/server'

export async function GET() {
  // 環境変数の設定状況を確認
  const config = {
    X_API_KEY: !!process.env.X_API_KEY,
    X_API_SECRET: !!process.env.X_API_SECRET,
    X_ACCESS_TOKEN: !!process.env.X_ACCESS_TOKEN,
    X_ACCESS_TOKEN_SECRET: !!process.env.X_ACCESS_TOKEN_SECRET,
  }

  const allConfigured = Object.values(config).every(v => v === true)

  return NextResponse.json({
    status: allConfigured ? '✅ 設定完了' : '⚠️ 設定が必要',
    configured: config,
    setupGuide: {
      step1: {
        title: 'X Developer Portalでアプリを作成',
        url: 'https://developer.twitter.com/en/portal/dashboard',
        actions: [
          'Create Projectをクリック',
          'プロジェクト名を入力',
          'App environmentで「Production」を選択',
          'App nameを入力'
        ]
      },
      step2: {
        title: 'APIキーを取得',
        location: 'Keys and tokens タブ',
        keys: [
          'API Key (Consumer Key)',
          'API Secret (Consumer Secret)',
          'Access Token',
          'Access Token Secret'
        ],
        note: 'Regenerateボタンで新規生成できます'
      },
      step3: {
        title: 'Vercelに環境変数を設定',
        url: 'https://vercel.com/dashboard',
        variables: [
          'X_API_KEY=your_api_key',
          'X_API_SECRET=your_api_secret',
          'X_ACCESS_TOKEN=your_access_token',
          'X_ACCESS_TOKEN_SECRET=your_access_token_secret'
        ]
      },
      step4: {
        title: 'アプリを再デプロイ',
        action: 'Vercelで「Redeploy」をクリック'
      }
    },
    currentStatus: {
      X_API_KEY: config.X_API_KEY ? '✅ 設定済み' : '❌ 未設定',
      X_API_SECRET: config.X_API_SECRET ? '✅ 設定済み' : '❌ 未設定',
      X_ACCESS_TOKEN: config.X_ACCESS_TOKEN ? '✅ 設定済み' : '❌ 未設定',
      X_ACCESS_TOKEN_SECRET: config.X_ACCESS_TOKEN_SECRET ? '✅ 設定済み' : '❌ 未設定'
    },
    testEndpoint: '/api/x/test-post'
  })
}