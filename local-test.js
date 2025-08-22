const localTest = async () => {
  const now = new Date()
  const pastTime = new Date(now.getTime() - 60000) // 過去時刻
  
  console.log('🔧 ローカルテスト')
  
  // 1. コンテンツ作成
  const content = `ローカルテスト ${now.toLocaleTimeString('ja-JP')} #LocalTest`
  const createUrl = `http://localhost:3005/api/gpts/universal?action=save&content=${encodeURIComponent(content)}&platform=x`
  
  const createRes = await fetch(createUrl)
  const createData = await createRes.json()
  const postId = createData.contentId || createData.id
  
  console.log('✅ 投稿ID:', postId)
  
  // 2. 即実行対象として登録
  await fetch('http://localhost:3005/api/scheduled-posts/update', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: postId,
      scheduled_for: pastTime.toISOString(),
      status: 'pending'
    })
  })
  
  // 3. スケジューラー実行
  console.log('⏰ スケジューラー実行...')
  const schedulerRes = await fetch('http://localhost:3005/api/scheduler/start?action=run')
  const schedulerData = await schedulerRes.json()
  console.log('結果:', schedulerData)
  
  // 4. ステータス確認
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  const listRes = await fetch('http://localhost:3005/api/scheduled-posts')
  const posts = await listRes.json()
  const testPost = posts.find(p => p.id === postId)
  
  if (testPost) {
    console.log('📊 最終ステータス:', testPost.status)
    if (testPost.status === 'posted') {
      console.log('🎉 成功！')
      return true
    } else {
      console.log('❌ 失敗:', testPost.metadata?.error)
      return false
    }
  }
  return false
}

localTest().then(success => {
  if (success) {
    console.log('\n✅ ローカルで成功！本番環境でテストします...')
  } else {
    console.log('\n⚠️ ローカルで失敗。修正が必要です。')
  }
})