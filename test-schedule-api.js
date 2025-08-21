// スケジュールAPIテストスクリプト

const BASE_URL = 'http://localhost:3000';

async function testScheduleAPI() {
  console.log('📝 スケジュールAPIをテスト中...\n');
  
  try {
    // まずGPTsコンテンツ一覧を取得
    console.log('1. GPTsコンテンツ一覧を取得...');
    const listResponse = await fetch(`${BASE_URL}/api/gpts/contents`);
    const listData = await listResponse.json();
    
    if (listData.contents && listData.contents.length > 0) {
      const testPost = listData.contents[0];
      console.log(`   テスト対象: ${testPost.id}`);
      console.log(`   Content: ${testPost.content.substring(0, 50)}...`);
      
      // GETメソッドでエンドポイントの確認
      console.log('\n2. GETメソッドでエンドポイント確認...');
      const getResponse = await fetch(`${BASE_URL}/api/gpts/contents/${testPost.id}/schedule`);
      const getResult = await getResponse.json();
      console.log('   Response:', getResult);
      
      // PUTメソッドでスケジュール設定
      console.log('\n3. PUTメソッドでスケジュール設定...');
      const scheduledTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const scheduleResponse = await fetch(`${BASE_URL}/api/gpts/contents/${testPost.id}/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduled_for: scheduledTime
        })
      });
      
      console.log(`   Status: ${scheduleResponse.status}`);
      console.log(`   Status Text: ${scheduleResponse.statusText}`);
      
      if (scheduleResponse.ok) {
        const scheduleResult = await scheduleResponse.json();
        console.log('   ✅ スケジュール成功:', scheduleResult);
      } else {
        const errorText = await scheduleResponse.text();
        console.log('   ❌ エラー:', errorText);
      }
      
      // 更新後の確認
      console.log('\n4. 更新後のコンテンツを確認...');
      const updatedResponse = await fetch(`${BASE_URL}/api/gpts/contents`);
      const updatedData = await updatedResponse.json();
      const updatedPost = updatedData.contents.find(p => p.id === testPost.id);
      if (updatedPost) {
        console.log(`   Status: ${updatedPost.status}`);
        console.log(`   Scheduled for: ${updatedPost.scheduled_for}`);
      }
      
    } else {
      console.log('❌ テスト用のGPTsコンテンツが見つかりません');
    }
    
  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

// 実行
testScheduleAPI();