const testBrowserScheduler = async () => {
  const PROD_URL = 'https://note-analytics.vercel.app'
  const now = new Date()
  const futureTime = new Date(now.getTime() + 70000) // 70秒後（1分ちょっと後）
  
  console.log('🌐 ブラウザーベース自動投稿テスト')
  console.log('📅 現在時刻:', now.toLocaleTimeString('ja-JP'))
  console.log('⏰ 投稿予定:', futureTime.toLocaleTimeString('ja-JP'))
  
  // 1. テスト用コンテンツを作成
  const content = `ブラウザー自動投稿テスト ${now.toLocaleTimeString('ja-JP')} - 成功確認 #AutoPost`
  const createUrl = `${PROD_URL}/api/gpts/universal?action=save&content=${encodeURIComponent(content)}&platform=x`
  
  console.log('📝 コンテンツ作成中...')
  const createRes = await fetch(createUrl)
  const createData = await createRes.json()
  const postId = createData.contentId || createData.id
  
  console.log('✅ 投稿ID:', postId)
  
  // 2. スケジュール登録（70秒後）
  console.log('⏰ 70秒後にスケジュール登録...')
  await fetch(`${PROD_URL}/api/scheduled-posts/update`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: postId,
      scheduled_for: futureTime.toISOString(),
      status: 'pending'
    })
  })
  
  console.log('\n📌 重要：ブラウザーでダッシュボードを開いてください')
  console.log(`URL: ${PROD_URL}/scheduled-posts`)
  console.log('ブラウザーを開いたままにして、自動投稿を待ちます...')
  
  // 3. 定期的にステータスチェック（2分間）
  let checkCount = 0
  const maxChecks = 12 // 10秒×12回 = 2分
  
  const checkInterval = setInterval(async () => {
    checkCount++
    
    const listRes = await fetch(`${PROD_URL}/api/scheduled-posts`)
    const posts = await listRes.json()
    const testPost = posts.find(p => p.id === postId)
    
    if (testPost) {
      const now = new Date()
      console.log(`\n[${now.toLocaleTimeString('ja-JP')}] ステータス: ${testPost.status}`)
      
      if (testPost.status === 'posted') {
        console.log('\n🎉🎉🎉 成功！ブラウザーベースの自動投稿が動作しました！')
        console.log('✅ スケジュール投稿問題が解決されました')
        clearInterval(checkInterval)
        return
      } else if (testPost.status === 'failed') {
        console.log('❌ 投稿失敗:', testPost.metadata?.error)
        clearInterval(checkInterval)
        return
      }
    }
    
    if (checkCount >= maxChecks) {
      console.log('\n⏱️ タイムアウト - 2分経過')
      clearInterval(checkInterval)
    }
  }, 10000) // 10秒ごとにチェック
}

testBrowserScheduler().catch(console.error)