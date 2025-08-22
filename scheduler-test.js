const testScheduler = async () => {
  const PROD_URL = 'https://note-analytics.vercel.app'
  const now = new Date()
  const threeMinutesLater = new Date(now.getTime() + 3 * 60 * 1000) // 3分後
  
  console.log('⏰ 5分周期スケジューラーテスト')
  console.log('📅 現在時刻:', now.toLocaleTimeString('ja-JP'))
  console.log('🎯 投稿予定:', threeMinutesLater.toLocaleTimeString('ja-JP'))
  
  // 1. テスト用コンテンツを作成
  const content = `5分周期スケジューラーテスト ${now.toLocaleTimeString('ja-JP')} - 成功確認 #SchedulerTest`
  const createUrl = `${PROD_URL}/api/gpts/universal?action=save&content=${encodeURIComponent(content)}&platform=x`
  
  console.log('\n📝 コンテンツ作成中...')
  const createRes = await fetch(createUrl)
  const createData = await createRes.json()
  const postId = createData.contentId || createData.id
  
  console.log('✅ 投稿ID:', postId)
  
  // 2. 3分後にスケジュール登録
  console.log('⏰ 3分後にスケジュール登録...')
  await fetch(`${PROD_URL}/api/scheduled-posts/update`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: postId,
      scheduled_for: threeMinutesLater.toISOString(),
      status: 'pending'
    })
  })
  
  // 3. 手動でスケジューラーチェックを実行
  console.log('\n🔄 スケジューラーチェックを手動実行...')
  const checkRes = await fetch(`${PROD_URL}/api/scheduler/check`)
  const checkData = await checkRes.json()
  
  console.log('チェック結果:', checkData)
  
  if (checkData.posts && checkData.posts.length > 0) {
    console.log('\n✅ スケジューラーがタイマーを設定しました')
    console.log('投稿は約3分後に自動実行されます')
    
    // 4. 定期的にステータスチェック
    console.log('\n📊 ステータスを監視中...')
    let checkCount = 0
    const maxChecks = 25 // 10秒×25回 = 約4分
    
    const checkInterval = setInterval(async () => {
      checkCount++
      
      const listRes = await fetch(`${PROD_URL}/api/scheduled-posts`)
      const posts = await listRes.json()
      const testPost = posts.find(p => p.id === postId)
      
      if (testPost) {
        const now = new Date()
        console.log(`[${now.toLocaleTimeString('ja-JP')}] ステータス: ${testPost.status}`)
        
        if (testPost.status === 'posted') {
          console.log('\n🎉🎉🎉 成功！5分周期スケジューラーが正常に動作しました！')
          console.log('✅ スケジュール投稿問題が完全に解決されました')
          clearInterval(checkInterval)
          return
        } else if (testPost.status === 'failed') {
          console.log('❌ 投稿失敗:', testPost.metadata?.error)
          clearInterval(checkInterval)
          return
        }
      }
      
      if (checkCount >= maxChecks) {
        console.log('\n⏱️ タイムアウト - 4分経過')
        clearInterval(checkInterval)
      }
    }, 10000) // 10秒ごとにチェック
  } else {
    console.log('⚠️ スケジューラーに投稿が登録されませんでした')
  }
}

testScheduler().catch(console.error)