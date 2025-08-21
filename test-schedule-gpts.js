// GPTsスケジュール登録のテストスクリプト

const BASE_URL = 'http://localhost:3000';

// 1. テスト用のGPTs投稿を作成
async function createTestPost() {
  console.log('📝 テスト用GPTs投稿を作成中...');
  
  const testContent = `【テスト投稿】${new Date().toLocaleString('ja-JP')}
これはGPTsスケジュール機能のテスト投稿です。
AIが生成したコンテンツのシミュレーションとして作成されました。
#テスト #GPTs #スケジューラー`;

  try {
    const response = await fetch(`${BASE_URL}/api/gpts/universal?action=save&content=${encodeURIComponent(testContent)}&platform=x`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    console.log('✅ GPTs投稿作成成功:', data);
    return data.data;
  } catch (error) {
    console.error('❌ GPTs投稿作成失敗:', error);
    return null;
  }
}

// 2. GPTs投稿一覧を取得
async function fetchGPTsPosts() {
  console.log('\n📋 GPTs投稿一覧を取得中...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/gpts/contents`);
    const data = await response.json();
    console.log(`✅ ${data.contents?.length || 0}件のGPTs投稿を取得`);
    
    if (data.contents && data.contents.length > 0) {
      console.log('\n最新の投稿:');
      data.contents.slice(0, 3).forEach((post, index) => {
        console.log(`${index + 1}. ID: ${post.id}`);
        console.log(`   内容: ${post.content.substring(0, 50)}...`);
        console.log(`   ステータス: ${post.status}`);
        console.log(`   プラットフォーム: ${post.platform}`);
        console.log(`   作成日時: ${new Date(post.created_at).toLocaleString('ja-JP')}`);
      });
    }
    
    return data.contents || [];
  } catch (error) {
    console.error('❌ GPTs投稿取得失敗:', error);
    return [];
  }
}

// 3. スケジュール登録のテスト
async function schedulePost(postId) {
  console.log(`\n⏰ 投稿ID ${postId} のスケジュール登録中...`);
  
  // 明日の10時に設定
  const scheduledFor = new Date();
  scheduledFor.setDate(scheduledFor.getDate() + 1);
  scheduledFor.setHours(10, 0, 0, 0);
  
  console.log(`   予定時刻: ${scheduledFor.toLocaleString('ja-JP')}`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/gpts/contents/${postId}/schedule`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scheduled_for: scheduledFor.toISOString()
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ スケジュール登録成功:', data);
      return data;
    } else {
      console.error('❌ スケジュール登録失敗:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ スケジュール登録エラー:', error);
    return null;
  }
}

// 4. スケジュール状態の確認
async function verifySchedule(postId) {
  console.log(`\n🔍 投稿ID ${postId} のスケジュール状態を確認中...`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/gpts/contents`);
    const data = await response.json();
    
    const post = data.contents?.find(p => p.id === postId);
    
    if (post) {
      console.log('✅ 投稿の現在の状態:');
      console.log(`   ステータス: ${post.status}`);
      console.log(`   スケジュール時刻: ${post.scheduled_for ? new Date(post.scheduled_for).toLocaleString('ja-JP') : '未設定'}`);
      return post;
    } else {
      console.log('❌ 投稿が見つかりません');
      return null;
    }
  } catch (error) {
    console.error('❌ 状態確認エラー:', error);
    return null;
  }
}

// メインのテスト実行
async function runTest() {
  console.log('🚀 GPTsスケジュール機能のテストを開始\n');
  console.log('=' .repeat(50));
  
  // 1. テスト投稿を作成
  const newPost = await createTestPost();
  
  if (!newPost) {
    console.log('\n❌ テスト投稿の作成に失敗したため、既存の投稿でテストします');
  }
  
  // 2. GPTs投稿一覧を取得
  const posts = await fetchGPTsPosts();
  
  if (posts.length === 0) {
    console.log('\n❌ GPTs投稿が見つかりません。テストを終了します。');
    return;
  }
  
  // 3. 最新の投稿（またはテスト投稿）をスケジュール
  const postToSchedule = newPost || posts[0];
  console.log(`\n📌 スケジュール対象: ID ${postToSchedule.id}`);
  
  const scheduleResult = await schedulePost(postToSchedule.id);
  
  if (scheduleResult) {
    // 4. スケジュール状態を確認
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機
    await verifySchedule(postToSchedule.id);
    
    console.log('\n✅ スケジュール登録テスト完了！');
  } else {
    console.log('\n❌ スケジュール登録テスト失敗');
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('テスト終了');
}

// テストを実行
runTest().catch(console.error);