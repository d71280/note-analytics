// スケジューラーのテストスクリプト

// テスト用のスケジュール投稿を作成
async function createTestPost() {
  const now = new Date();
  const scheduledTime = new Date(now.getTime() + 2 * 60 * 1000); // 2分後
  
  const testPost = {
    platform: 'x',
    content: `テスト投稿 ${now.toLocaleString('ja-JP')} - スケジューラー動作確認`,
    scheduled_for: scheduledTime.toISOString(),
    metadata: {
      source: 'test-script',
      created_at: now.toISOString()
    }
  };
  
  console.log('📝 テスト投稿を作成:', testPost);
  
  try {
    const response = await fetch('http://localhost:3000/api/schedule/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPost)
    });
    
    const result = await response.json();
    console.log('✅ 作成結果:', result);
    return result;
  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

// スケジュール状態を確認
async function checkScheduledPosts() {
  try {
    const response = await fetch('http://localhost:3000/api/scheduled-posts');
    const data = await response.json();
    
    console.log('\n📋 現在のスケジュール投稿:');
    if (data.posts && data.posts.length > 0) {
      data.posts.forEach(post => {
        const scheduledTime = new Date(post.scheduled_for);
        const now = new Date();
        const diff = scheduledTime - now;
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        console.log(`  - [${post.status}] ${post.content.substring(0, 30)}...`);
        console.log(`    予定: ${scheduledTime.toLocaleString('ja-JP')}`);
        if (post.status === 'pending' && diff > 0) {
          console.log(`    残り: ${minutes}分${seconds}秒`);
        }
      });
    } else {
      console.log('  投稿なし');
    }
  } catch (error) {
    console.error('❌ 確認エラー:', error);
  }
}

// スケジューラーの動作を監視
async function monitorScheduler() {
  console.log('🔍 スケジューラー監視を開始...\n');
  
  // テスト投稿を作成
  await createTestPost();
  
  // 30秒ごとに状態を確認
  const interval = setInterval(async () => {
    console.log(`\n⏰ ${new Date().toLocaleTimeString('ja-JP')}`);
    await checkScheduledPosts();
  }, 30000);
  
  // 初回確認
  await checkScheduledPosts();
  
  // 5分後に終了
  setTimeout(() => {
    clearInterval(interval);
    console.log('\n✅ テスト完了');
    process.exit(0);
  }, 5 * 60 * 1000);
}

// 実行
console.log('========================================');
console.log('  スケジューラー動作テスト');
console.log('========================================\n');

monitorScheduler().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});