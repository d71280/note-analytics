#!/usr/bin/env node

// 環境変数チェックスクリプト
console.log('🔍 Note Analytics Platform - 環境変数チェック\n')

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
]

let allGood = true

console.log('📋 必要な環境変数の確認:')
console.log('================================')

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar]
  const status = value ? '✅' : '❌'
  const displayValue = value 
    ? (envVar.includes('KEY') 
        ? `${value.substring(0, 20)}...` 
        : value)
    : 'NOT SET'
  
  console.log(`${status} ${envVar}: ${displayValue}`)
  
  if (!value) {
    allGood = false
  }
})

console.log('================================')

if (allGood) {
  console.log('🎉 すべての環境変数が設定されています！')
  console.log('\n次のステップ:')
  console.log('1. npm run dev でローカル開発サーバーを起動')
  console.log('2. http://localhost:3000 でアプリケーションを確認')
  console.log('3. /boost ページでNote API機能をテスト')
} else {
  console.log('⚠️  不足している環境変数があります')
  console.log('\n設定方法:')
  console.log('1. .env.local ファイルを編集')
  console.log('2. Supabaseダッシュボードから値を取得')
  console.log('3. 詳細は docs/environment-setup.md を参照')
  
  process.exit(1)
}

console.log('\n🚀 Note API機能について:')
console.log('- Note APIは認証不要で即座に利用可能')
console.log('- レート制限: 60リクエスト/分')
console.log('- 対応機能: 記事取得、ユーザー分析、検索、エンゲージメント分析')

console.log('\n📚 詳細ドキュメント:')
console.log('- 環境設定: docs/environment-setup.md')
console.log('- API仕様: lib/api/note-api-client.ts')
console.log('- 使用例: /submit, /boost ページ') 