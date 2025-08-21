// 削除APIテストスクリプト

const BASE_URL = 'http://localhost:3000';

async function testDeleteAPI() {
  console.log('🗑️ 削除APIをテスト中...\n');
  
  try {
    // 1. GPTsコンテンツ一覧を取得
    console.log('1. GPTsコンテンツ一覧を取得...');
    const listResponse = await fetch(`${BASE_URL}/api/gpts/contents`);
    const listData = await listResponse.json();
    console.log(`   総数: ${listData.total}`);
    
    if (listData.contents && listData.contents.length > 0) {
      // 最後のコンテンツを削除対象にする
      const targetPost = listData.contents[listData.contents.length - 1];
      console.log(`   削除対象: ${targetPost.id}`);
      console.log(`   内容: ${targetPost.content.substring(0, 50)}...`);
      
      // 2. 削除を実行
      console.log('\n2. 削除を実行...');
      const deleteResponse = await fetch(`${BASE_URL}/api/gpts/contents/${targetPost.id}`, {
        method: 'DELETE'
      });
      
      console.log(`   Status: ${deleteResponse.status} ${deleteResponse.statusText}`);
      console.log(`   Headers:`, Object.fromEntries(deleteResponse.headers.entries()));
      
      const responseText = await deleteResponse.text();
      console.log(`   Response: ${responseText}`);
      
      if (deleteResponse.ok) {
        try {
          const result = JSON.parse(responseText);
          console.log('   ✅ 削除成功:', result);
        } catch (e) {
          console.log('   ✅ 削除成功（レスポンス:）', responseText);
        }
      } else {
        console.log('   ❌ 削除失敗');
      }
      
      // 3. 削除後の確認
      console.log('\n3. 削除後の一覧を確認...');
      const afterResponse = await fetch(`${BASE_URL}/api/gpts/contents`);
      const afterData = await afterResponse.json();
      console.log(`   削除後の総数: ${afterData.total}`);
      
      const stillExists = afterData.contents.find(p => p.id === targetPost.id);
      if (stillExists) {
        console.log('   ⚠️ まだ存在しています');
      } else {
        console.log('   ✅ 正常に削除されました');
      }
      
    } else {
      console.log('❌ 削除するコンテンツがありません');
    }
    
  } catch (error) {
    console.error('❌ テストエラー:', error);
  }
}

// 実行
testDeleteAPI();