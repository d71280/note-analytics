// GPTsテストデータ作成スクリプト

const BASE_URL = 'http://localhost:3000';

async function createTestGPTsContent() {
  console.log('📝 GPTsテストコンテンツを作成中...');
  
  const testContent = `【GPTsテスト投稿】${new Date().toLocaleString('ja-JP')}
これはGPTs連携機能のテスト投稿です。
AIが生成したコンテンツのシミュレーションとして作成されました。
#GPTs #テスト #AI生成`;

  try {
    // universalエンドポイントを使用してGPTsコンテンツを作成
    const response = await fetch(`${BASE_URL}/api/gpts/universal?action=save&content=${encodeURIComponent(testContent)}&platform=x`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    console.log('✅ GPTsコンテンツ作成成功:', data);
    
    // コンテンツ一覧を取得して確認
    console.log('\n📋 GPTsコンテンツ一覧を取得中...');
    const listResponse = await fetch(`${BASE_URL}/api/gpts/contents`);
    const listData = await listResponse.json();
    
    console.log(`✅ GPTsコンテンツ数: ${listData.total}`);
    console.log('最新のコンテンツ:');
    listData.contents.slice(0, 3).forEach(content => {
      console.log(`  - ID: ${content.id}`);
      console.log(`    Platform: ${content.platform}`);
      console.log(`    Status: ${content.status}`);
      console.log(`    Source: ${content.metadata?.source}`);
      console.log(`    Content: ${content.content.substring(0, 50)}...`);
    });
    
  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

// 実行
createTestGPTsContent();