const finalTest = async () => {
  const PROD_URL = 'https://note-analytics.vercel.app'
  const now = new Date()
  const pastTime = new Date(now.getTime() - 60000) // 過去時刻で即実行
  
  console.log('🎯 最終テスト - 本番環境')
  console.log('📅 時刻:', now.toLocaleTimeString('ja-JP'))
  
  // 1. コンテンツ作成
  const content = `最終テスト ${now.toLocaleTimeString('ja-JP')} - 成功確認 #Final`
  const createUrl = `${PROD_URL}/api/gpts/universal?action=save&content=${encodeURIComponent(content)}&platform=x`
  
  const createRes = await fetch(createUrl)
  const createData = await createRes.json()
  const postId = createData.contentId || createData.id
  
  console.log('✅ 投稿ID:', postId)
  
  // 2. 即実行対象として登録
  await fetch(`${PROD_URL}/api/scheduled-posts/update`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: postId,
      scheduled_for: pastTime.toISOString(),
      status: 'pending'
    })
  })
  
  console.log('⏰ Cronを実行...')
  
  // 少し待ってからcron実行（デプロイが反映されるまで）
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  // 3. Cron実行
  const cronRes = await fetch(`${PROD_URL}/api/cron/auto-post`, {
    headers: { 'x-manual-test': 'true' }
  })
  const cronData = await cronRes.json()
  
  console.log('\n📊 結果:')
  if (cronData.results) {
    console.log('- 処理:', cronData.results.processed)
    console.log('- 成功:', cronData.results.posted)
    console.log('- 失敗:', cronData.results.failed)
    
    if (cronData.results.posted > 0) {
      console.log('\n🎉 成功！スケジュール投稿が動作しています！')
    } else if (cronData.results.errors) {
      console.log('\n❌ エラー:', cronData.results.errors[0])
    }
  }
}

finalTest().catch(console.error)