// スケジュール投稿のテスト
const BASE_URL = 'https://note-analytics.vercel.app';

async function testScheduledPost() {
  console.log('🚀 スケジュール投稿テスト開始\n');
  
  // 1. テスト用コンテンツを作成
  console.log('1️⃣ GPTs経由でテストコンテンツを作成...');
  const testContent = `【自動投稿テスト】${new Date().toLocaleTimeString('ja-JP')} に作成。このツイートが投稿されたら、スケジュール機能は正常に動作しています。#GPTsTest #自動投稿`;
  
  const createRes = await fetch(`${BASE_URL}/api/gpts/universal?action=save&content=${encodeURIComponent(testContent)}&platform=x`);
  const createData = await createRes.json();
  
  if (!createData.success) {
    console.error('❌ コンテンツ作成失敗');
    return;
  }
  
  const contentId = createData.contentId;
  console.log(`✅ コンテンツ作成成功: ${contentId}`);
  
  // 2. 3分後にスケジュール設定
  const scheduledTime = new Date(Date.now() + 3 * 60 * 1000); // 3分後
  console.log(`\n2️⃣ ${scheduledTime.toLocaleTimeString('ja-JP')} にスケジュール設定...`);
  
  const scheduleRes = await fetch(`${BASE_URL}/api/scheduled-posts/update`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: contentId,
      scheduled_for: scheduledTime.toISOString(),
      status: 'pending'
    })
  });
  
  const scheduleData = await scheduleRes.json();
  
  if (scheduleData.success) {
    console.log('✅ スケジュール設定成功!');
    console.log(`   予定時刻: ${new Date(scheduleData.data.scheduled_for).toLocaleString('ja-JP')}`);
    console.log(`   ステータス: ${scheduleData.data.status}`);
  } else {
    console.error('❌ スケジュール設定失敗:', scheduleData);
    return;
  }
  
  // 3. cron処理を手動トリガー
  console.log('\n3️⃣ cron処理の動作確認...');
  console.log('※ Vercelのcronは設定された時間に自動実行されます');
  
  // 4. 手動でcronをトリガー（テスト用）
  console.log('\n4️⃣ 手動でcron処理をトリガー（テスト）...');
  const cronRes = await fetch(`${BASE_URL}/api/cron/process-posts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET || 'test-secret'}`
    }
  });
  
  if (cronRes.ok) {
    const cronData = await cronRes.json();
    console.log('✅ cron処理結果:', cronData);
  } else {
    console.log('⚠️ cron処理レスポンス:', cronRes.status);
  }
  
  // 5. 投稿状態を確認
  console.log('\n5️⃣ 投稿状態を確認...');
  const checkRes = await fetch(`${BASE_URL}/api/scheduled-posts`);
  const posts = await checkRes.json();
  
  const targetPost = posts.find(p => p.id === contentId);
  if (targetPost) {
    console.log('📊 投稿の現在の状態:');
    console.log(`   ID: ${targetPost.id}`);
    console.log(`   内容: ${targetPost.content.substring(0, 50)}...`);
    console.log(`   ステータス: ${targetPost.status}`);
    console.log(`   予定時刻: ${targetPost.scheduled_for ? new Date(targetPost.scheduled_for).toLocaleString('ja-JP') : 'なし'}`);
    console.log(`   公開時刻: ${targetPost.published_at ? new Date(targetPost.published_at).toLocaleString('ja-JP') : 'まだ'}`);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📝 結果:');
  console.log('1. テストコンテンツの作成: ✅');
  console.log('2. スケジュール設定: ✅');
  console.log('3. 3分後に自動投稿されるか確認してください');
  console.log('\n⏰ 予定時刻になったら:');
  console.log('1. X (Twitter) で投稿を確認');
  console.log('2. 投稿管理ページでステータスが「published」になっているか確認');
}

// 実行
testScheduledPost().catch(console.error);