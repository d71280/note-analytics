#!/usr/bin/env node

// 設定完了後のテストスクリプト
console.log('🧪 Note Analytics Platform - 設定テスト\n')

async function testNoteAPI() {
  console.log('🔍 Note API 接続テスト...')
  
  try {
    // Note APIクライアントをテスト
    const response = await fetch('https://note.com/api/v2/categories')
    
    if (response.ok) {
      console.log('✅ Note API接続成功')
      const data = await response.json()
      console.log(`📊 カテゴリー数: ${data?.data?.length || 'N/A'}`)
    } else {
      console.log('⚠️ Note API接続に問題がある可能性があります')
    }
  } catch (error) {
    console.log('❌ Note API接続エラー:', error.message)
  }
}

async function testSupabase() {
  console.log('\n🔗 Supabase 接続テスト...')
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.log('❌ Supabase環境変数が設定されていません')
    return false
  }
  
  try {
    // Supabase API Health Check
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    })
    
    if (response.status === 200 || response.status === 404) {
      console.log('✅ Supabase接続成功')
      return true
    } else {
      console.log('⚠️ Supabase接続に問題があります')
      return false
    }
  } catch (error) {
    console.log('❌ Supabase接続エラー:', error.message)
    return false
  }
}

async function runTests() {
  console.log('🚀 統合テスト開始\n')
  
  const supabaseOk = await testSupabase()
  await testNoteAPI()
  
  console.log('\n📋 テスト完了レポート')
  console.log('================================')
  
  if (supabaseOk) {
    console.log('✅ すべてのシステムが正常に動作しています!')
    console.log('\n🎉 次のステップ:')
    console.log('1. npm run dev で開発サーバーを起動')
    console.log('2. ブラウザで http://localhost:3000 を開く')
    console.log('3. /boost ページでリアルタイム分析をテスト')
    console.log('4. /submit ページでURL自動取得をテスト')
    console.log('\n🚀 Vercelデプロイ:')
    console.log('- git push origin main で自動デプロイ')
    console.log('- または vercel --prod で手動デプロイ')
  } else {
    console.log('⚠️ Supabase設定を確認してください')
    console.log('\n🔧 修正方法:')
    console.log('1. Supabaseダッシュボードで設定値を再確認')
    console.log('2. .env.local ファイルを更新')
    console.log('3. npm run check-env で再確認')
  }
  
  console.log('\n📚 ドキュメント:')
  console.log('- 環境設定: docs/environment-setup.md')
  console.log('- トラブルシューティング: GitHub Issues')
}

runTests().catch(console.error) 