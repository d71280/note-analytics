// GPTs連携の完全フローテスト

const BASE_URL = 'http://localhost:3000';

async function testCompleteFlow() {
  console.log('🚀 GPTs連携の完全フローテスト開始...\n');
  
  try {
    // 1. テストデータを作成
    console.log('1. テストデータを作成...');
    const testPosts = [
      {
        content: '【テスト1】今日の気づき：小さな一歩が大きな変化を生む。続けることの大切さを改めて実感。#継続は力なり',
        platform: 'x'
      },
      {
        content: '【テスト2】失敗を恐れずに挑戦する勇気。それが成長への第一歩。今日も新しいことにチャレンジ！',
        platform: 'x'
      },
      {
        content: '【テスト3】感謝の気持ちを忘れずに。周りの人々に支えられて今がある。ありがとう。',
        platform: 'x'
      }
    ];
    
    const createdIds = [];
    
    for (const post of testPosts) {
      const response = await fetch(`${BASE_URL}/api/gpts/universal?action=save&content=${encodeURIComponent(post.content)}&platform=${post.platform}`, {
        method: 'GET'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ 作成成功: ${data.contentId}`);
        createdIds.push(data.contentId);
      } else {
        console.log(`   ❌ 作成失敗:`, await response.text());
      }
    }
    
    // 2. 一覧を確認
    console.log('\n2. GPTsコンテンツ一覧を確認...');
    const listResponse = await fetch(`${BASE_URL}/api/gpts/contents`);
    const listData = await listResponse.json();
    console.log(`   総数: ${listData.total}`);
    
    if (listData.contents && listData.contents.length > 0) {
      // 3. スケジュール設定をテスト
      console.log('\n3. スケジュール設定をテスト...');
      const firstPost = listData.contents[0];
      const scheduledTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      const scheduleResponse = await fetch(`${BASE_URL}/api/gpts/contents/${firstPost.id}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduled_for: scheduledTime,
          status: 'pending'
        })
      });
      
      console.log(`   Status: ${scheduleResponse.status}`);
      if (scheduleResponse.ok) {
        const scheduleData = await scheduleResponse.json();
        console.log(`   ✅ スケジュール設定成功`);
        console.log(`   予定時刻: ${scheduleData.data.scheduled_for}`);
      } else {
        console.log(`   ❌ スケジュール設定失敗:`, await scheduleResponse.text());
      }
      
      // 4. スケジュール解除をテスト
      console.log('\n4. スケジュール解除をテスト...');
      const unscheduleResponse = await fetch(`${BASE_URL}/api/gpts/contents/${firstPost.id}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduled_for: null,
          status: 'draft'
        })
      });
      
      if (unscheduleResponse.ok) {
        console.log(`   ✅ スケジュール解除成功`);
      } else {
        console.log(`   ❌ スケジュール解除失敗`);
      }
      
      // 5. 削除をテスト
      console.log('\n5. 削除をテスト...');
      if (listData.contents.length > 2) {
        const deleteTarget = listData.contents[listData.contents.length - 1];
        const deleteResponse = await fetch(`${BASE_URL}/api/gpts/contents/${deleteTarget.id}`, {
          method: 'DELETE'
        });
        
        console.log(`   Status: ${deleteResponse.status}`);
        if (deleteResponse.ok) {
          console.log(`   ✅ 削除成功: ${deleteTarget.id}`);
        } else {
          console.log(`   ❌ 削除失敗:`, await deleteResponse.text());
        }
      }
      
      // 6. 最終確認
      console.log('\n6. 最終的な一覧を確認...');
      const finalResponse = await fetch(`${BASE_URL}/api/gpts/contents`);
      const finalData = await finalResponse.json();
      console.log(`   最終総数: ${finalData.total}`);
      
      if (finalData.contents) {
        finalData.contents.slice(0, 3).forEach((post, index) => {
          console.log(`   [${index + 1}] ${post.content.substring(0, 30)}... (${post.status})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ テストエラー:', error);
  }
}

// 実行
testCompleteFlow();