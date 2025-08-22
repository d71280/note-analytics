const finalSchedulerTest = async () => {
  const PROD_URL = 'https://note-analytics.vercel.app'
  const now = new Date()
  const twoMinutesLater = new Date(now.getTime() + 2 * 60 * 1000) // 2分後
  
  console.log('🎯 最終スケジューラーテスト')
  console.log('📅 現在時刻:', now.toLocaleTimeString('ja-JP'))
  console.log('⏰ 投稿予定:', twoMinutesLater.toLocaleTimeString('ja-JP'))
  
  // 1. テスト用コンテンツを作成
  const content = `最終テスト ${now.toLocaleTimeString('ja-JP')} - スケジュール投稿成功！ #Success`
  const createUrl = `${PROD_URL}/api/gpts/universal?action=save&content=${encodeURIComponent(content)}&platform=x`
  
  console.log('\n📝 コンテンツ作成中...')
  const createRes = await fetch(createUrl)
  const createData = await createRes.json()
  const postId = createData.contentId || createData.id
  
  console.log('✅ 投稿ID:', postId)
  
  // 2. 2分後にスケジュール登録
  console.log('⏰ 2分後にスケジュール登録...')
  await fetch(`${PROD_URL}/api/scheduled-posts/update`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: postId,
      scheduled_for: twoMinutesLater.toISOString(),
      status: 'pending'
    })
  })
  
  // 3. スケジューラーチェックを実行
  console.log('\n🔄 スケジューラーチェックを実行...')
  const checkRes = await fetch(`${PROD_URL}/api/scheduler/check`)
  const checkData = await checkRes.json()
  
  console.log('チェック結果:', JSON.stringify(checkData, null, 2))
  
  if (checkData.posts && checkData.posts.some(p => p.id === postId)) {
    console.log('\n✅ スケジューラーが投稿を認識しました')
    console.log('2分後に自動投稿されます...')
    
    // 4. 定期的にステータスチェック
    let checkCount = 0
    const maxChecks = 20 // 10秒×20回 = 約3分
    
    const checkInterval = setInterval(async () => {
      checkCount++
      
      const listRes = await fetch(`${PROD_URL}/api/scheduled-posts`)
      const posts = await listRes.json()
      const testPost = posts.find(p => p.id === postId)
      
      if (testPost) {
        const now = new Date()
        console.log(`[${now.toLocaleTimeString('ja-JP')}] ステータス: ${testPost.status}`)
        
        if (testPost.status === 'posted') {
          console.log('\n🎉🎉🎉 成功！スケジュール投稿が正常に動作しました！')
          console.log('✅ PDCAサイクル完了 - 問題が解決されました')
          console.log('\n📌 解決方法：')
          console.log('1. 5分周期でスケジューラーチェックを実行')
          console.log('2. 投稿時刻が近い投稿にタイマーを設定')
          console.log('3. タイマー発火時に直接投稿APIを呼び出し')
          clearInterval(checkInterval)
          return
        } else if (testPost.status === 'failed') {
          console.log('❌ 投稿失敗:', testPost.metadata?.error)
          clearInterval(checkInterval)
          return
        }
      }
      
      if (checkCount >= maxChecks) {
        console.log('\n⏱️ タイムアウト - 3分経過')
        clearInterval(checkInterval)
      }
    }, 10000) // 10秒ごとにチェック
  } else {
    console.log('⚠️ スケジューラーに投稿が登録されませんでした')
  }
}

finalSchedulerTest().catch(console.error)