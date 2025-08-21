// 手動投稿テストスクリプト

const BASE_URL = 'http://localhost:3000';

async function createManualPost() {
  console.log('📝 手動投稿を作成中...');
  
  const testContent = `【手動投稿テスト】${new Date().toLocaleString('ja-JP')}
これは手動で作成されたスケジュール投稿のテストです。
GPTsではなく、ユーザーが直接作成した投稿です。
#手動投稿 #テスト`;

  try {
    // スケジュール投稿APIを使用して手動投稿を作成
    const response = await fetch(`${BASE_URL}/api/scheduled-posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: testContent,
        platform: 'x',
        scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 明日にスケジュール
      })
    });

    const data = await response.json();
    console.log('✅ 手動投稿作成成功:', data);
    
    // スケジュール投稿一覧を取得して確認
    console.log('\n📋 スケジュール投稿一覧を取得中...');
    const listResponse = await fetch(`${BASE_URL}/api/scheduled-posts`);
    const listData = await listResponse.json();
    
    console.log(`✅ スケジュール投稿数: ${listData.length}`);
    console.log('投稿一覧:');
    listData.slice(0, 3).forEach(post => {
      console.log(`  - ID: ${post.id}`);
      console.log(`    Platform: ${post.platform}`);
      console.log(`    Status: ${post.status}`);
      console.log(`    Source: ${post.metadata?.source || 'N/A'}`);
      console.log(`    Content: ${post.content.substring(0, 50)}...`);
    });
    
  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

// 実行
createManualPost();