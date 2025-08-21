// スケジュールエラー詳細確認スクリプト

const BASE_URL = 'http://localhost:3000';
const TEST_POST_ID = '16d33fbd-d7aa-4b3e-95ac-5da1e0df59cb'; // 「センスないかも」の投稿

async function testScheduleError() {
  console.log('🔍 スケジュールエラーを詳細確認中...\n');
  
  try {
    // 1. 現在の投稿状態を確認
    console.log('1. 現在の投稿状態を確認...');
    const listResponse = await fetch(`${BASE_URL}/api/gpts/contents`);
    const listData = await listResponse.json();
    const currentPost = listData.contents.find(p => p.id === TEST_POST_ID);
    
    if (currentPost) {
      console.log('   現在の状態:');
      console.log(`   - ID: ${currentPost.id}`);
      console.log(`   - Status: ${currentPost.status}`);
      console.log(`   - Scheduled for: ${currentPost.scheduled_for || 'なし'}`);
      console.log(`   - Platform: ${currentPost.platform}`);
      console.log(`   - Source: ${currentPost.metadata?.source}`);
    } else {
      console.log('   ❌ 投稿が見つかりません');
      return;
    }
    
    // 2. スケジュール設定を試行
    console.log('\n2. スケジュール設定を試行...');
    const scheduledTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    console.log(`   設定時刻: ${scheduledTime}`);
    
    const scheduleResponse = await fetch(`${BASE_URL}/api/gpts/contents/${TEST_POST_ID}/schedule`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scheduled_for: scheduledTime,
        status: 'pending'
      })
    });
    
    console.log(`   Response Status: ${scheduleResponse.status} ${scheduleResponse.statusText}`);
    console.log(`   Response Headers:`, Object.fromEntries(scheduleResponse.headers.entries()));
    
    // レスポンスボディの取得を試行
    const responseText = await scheduleResponse.text();
    console.log(`   Response Body: ${responseText.substring(0, 200)}`);
    
    // JSONとしてパースを試行
    try {
      const responseData = JSON.parse(responseText);
      console.log('   Parsed Response:', responseData);
    } catch (e) {
      console.log('   ❌ JSONパースエラー:', e.message);
    }
    
    // 3. OPTIONS リクエストをテスト
    console.log('\n3. OPTIONS リクエストをテスト...');
    const optionsResponse = await fetch(`${BASE_URL}/api/gpts/contents/${TEST_POST_ID}/schedule`, {
      method: 'OPTIONS'
    });
    console.log(`   OPTIONS Status: ${optionsResponse.status}`);
    console.log(`   CORS Headers:`, Object.fromEntries(optionsResponse.headers.entries()));
    
  } catch (error) {
    console.error('❌ テストエラー:', error);
  }
}

// 実行
testScheduleError();