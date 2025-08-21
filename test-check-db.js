// データベース内容確認スクリプト

const BASE_URL = 'http://localhost:3000';

async function checkDatabase() {
  console.log('📊 データベース内容を確認中...\n');
  
  try {
    // 直接Supabaseから全データを取得するAPIを作成
    const response = await fetch(`${BASE_URL}/api/test/check-env`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      console.log('既存のAPIを使用...\n');
    }

    // GPTsコンテンツAPIを確認
    console.log('=== GPTs連携コンテンツAPI ===');
    const gptsResponse = await fetch(`${BASE_URL}/api/gpts/contents`);
    const gptsData = await gptsResponse.json();
    
    console.log(`総数: ${gptsData.total}`);
    console.log('\nコンテンツ詳細:');
    (gptsData.contents || []).forEach((content, index) => {
      console.log(`\n[${index + 1}] ID: ${content.id}`);
      console.log(`    Platform: ${content.platform}`);
      console.log(`    Status: ${content.status}`);
      console.log(`    Source: ${content.metadata?.source}`);
      console.log(`    Created: ${content.created_at}`);
      console.log(`    Content: ${(content.content || '').substring(0, 50)}...`);
    });
    
    console.log('\n\n=== スケジュール投稿管理API ===');
    const scheduleResponse = await fetch(`${BASE_URL}/api/scheduled-posts`);
    const scheduleData = await scheduleResponse.json();
    
    console.log(`総数: ${scheduleData.length}`);
    console.log('\n投稿詳細:');
    (scheduleData || []).forEach((post, index) => {
      console.log(`\n[${index + 1}] ID: ${post.id}`);
      console.log(`    Platform: ${post.platform}`);
      console.log(`    Status: ${post.status}`);
      console.log(`    Source: ${post.metadata?.source}`);
      console.log(`    Created: ${post.created_at}`);
      console.log(`    Content: ${(post.content || '').substring(0, 50)}...`);
    });
    
  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

// 実行
checkDatabase();