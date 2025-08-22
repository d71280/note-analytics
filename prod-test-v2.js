const testProduction = async () => {
  const PROD_URL = 'https://note-analytics.vercel.app'
  const now = new Date()
  const pastTime = new Date(now.getTime() - 60000) // 1分前
  
  console.log('🚀 本番環境テスト v2 - 直接APIクライアント版')
  console.log('📅 時刻:', now.toLocaleTimeString('ja-JP'))
  
  // 1. テスト用コンテンツを作成
  const content = `本番テストv2 ${now.toLocaleTimeString('ja-JP')} - 直接クライアント #Test`
  const createUrl = `${PROD_URL}/api/gpts/universal?action=save&content=${encodeURIComponent(content)}&platform=x`
  
  console.log('📝 コンテンツ作成中...')
  const createRes = await fetch(createUrl)
  const createData = await createRes.json()
  const postId = createData.contentId || createData.id
  
  console.log('✅ 投稿ID:', postId)
  
  // 2. スケジュール登録（過去時刻で即実行対象）
  console.log('⏰ スケジュール登録中...')
  await fetch(`${PROD_URL}/api/scheduled-posts/update`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: postId,
      scheduled_for: pastTime.toISOString(),
      status: 'pending'
    })
  })
  
  // デプロイが反映されるまで少し待つ
  console.log('⏳ デプロイの反映を待機中... (10秒)')
  await new Promise(resolve => setTimeout(resolve, 10000))
  
  // 3. Cron実行
  console.log('🔄 Cronジョブを実行...')
  const cronRes = await fetch(`${PROD_URL}/api/cron/auto-post`, {
    headers: { 'x-manual-test': 'true' }
  })
  
  const cronData = await cronRes.json()
  
  console.log('\n📊 実行結果:')
  if (cronData.results) {
    console.log('  処理数:', cronData.results.processed)
    console.log('  成功数:', cronData.results.posted)
    console.log('  失敗数:', cronData.results.failed)
    
    if (cronData.results.posted > 0) {
      console.log('\n🎉🎉🎉 成功！スケジュール投稿が動作しています！')
      console.log('✅ PDCAサイクル完了 - 問題解決')
    } else if (cronData.results.failed > 0) {
      console.log('\n❌ 投稿失敗')
      if (cronData.results.errors && cronData.results.errors.length > 0) {
        console.log('エラー詳細:', cronData.results.errors)
      }
    }
  } else if (cronData.error) {
    console.log('❌ エラー:', cronData.error)
    if (cronData.details) {
      console.log('詳細:', cronData.details)
    }
  }
  
  // 4. 投稿の最終ステータス確認
  console.log('\n📋 投稿の最終ステータスを確認中...')
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  const listRes = await fetch(`${PROD_URL}/api/scheduled-posts`)
  const posts = await listRes.json()
  const testPost = posts.find(p => p.id === postId)
  
  if (testPost) {
    console.log('最終ステータス:', testPost.status)
    if (testPost.metadata?.error) {
      console.log('エラー内容:', testPost.metadata.error)
    }
  }
}

testProduction().catch(console.error)