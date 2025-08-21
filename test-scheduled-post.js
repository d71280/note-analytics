// スケジュール投稿の実行テスト

const BASE_URL = 'http://localhost:3000';

// 1. 現在のペンディング投稿を確認
async function checkPendingPosts() {
  console.log('📋 ペンディング中の投稿を確認...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/gpts/contents`);
    const data = await response.json();
    
    const pendingPosts = data.contents?.filter(post => post.status === 'pending') || [];
    
    console.log(`✅ ${pendingPosts.length}件のペンディング投稿があります`);
    
    if (pendingPosts.length > 0) {
      pendingPosts.forEach(post => {
        console.log(`\n📌 ID: ${post.id}`);
        console.log(`   内容: ${post.content.substring(0, 50)}...`);
        console.log(`   プラットフォーム: ${post.platform}`);
        console.log(`   予定時刻: ${new Date(post.scheduled_for).toLocaleString('ja-JP')}`);
      });
      
      return pendingPosts[0]; // 最初の投稿を返す
    }
    
    return null;
  } catch (error) {
    console.error('❌ 確認エラー:', error);
    return null;
  }
}

// 2. 手動でcronジョブを実行
async function triggerCronJob() {
  console.log('\n🔄 Cronジョブを手動実行中...\n');
  
  try {
    // CRON_SECRETが設定されていない場合は直接実行
    const response = await fetch(`${BASE_URL}/api/cron/process-posts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET || 'test-secret'}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Cronジョブ実行結果:', data);
      
      if (data.results && data.results.length > 0) {
        data.results.forEach(result => {
          if (result.status === 'posted') {
            console.log(`\n🎉 投稿成功: ${result.id}`);
            console.log(`   プラットフォーム: ${result.platform}`);
          } else if (result.status === 'failed') {
            console.log(`\n❌ 投稿失敗: ${result.id}`);
            console.log(`   エラー: ${result.error}`);
          }
        });
      }
      
      return data;
    } else {
      console.error('❌ Cronジョブエラー:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Cronジョブ実行エラー:', error);
    return null;
  }
}

// 3. 時刻を過去に更新して即座に実行可能にする
async function updateScheduleToNow(postId) {
  console.log(`\n⏰ 投稿 ${postId} のスケジュール時刻を現在に変更...\n`);
  
  try {
    // 5分前の時刻に設定（確実に実行対象になるように）
    const pastTime = new Date(Date.now() - 5 * 60 * 1000);
    
    const response = await fetch(`${BASE_URL}/api/gpts/contents/${postId}/schedule`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scheduled_for: pastTime.toISOString()
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ スケジュール時刻を更新しました');
      console.log(`   新しい時刻: ${pastTime.toLocaleString('ja-JP')}`);
      return true;
    } else {
      console.error('❌ スケジュール更新失敗:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ スケジュール更新エラー:', error);
    return false;
  }
}

// 4. 投稿結果を確認
async function checkPostStatus(postId) {
  console.log(`\n🔍 投稿 ${postId} のステータスを確認...\n`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/gpts/contents`);
    const data = await response.json();
    
    const post = data.contents?.find(p => p.id === postId);
    
    if (post) {
      console.log('📊 投稿の現在のステータス:');
      console.log(`   ステータス: ${post.status}`);
      
      if (post.status === 'posted') {
        console.log('   ✅ 投稿が正常に完了しました！');
        if (post.metadata?.response) {
          console.log('   レスポンス:', post.metadata.response);
        }
      } else if (post.status === 'failed') {
        console.log('   ❌ 投稿に失敗しました');
        if (post.error_message) {
          console.log('   エラー:', post.error_message);
        }
      } else if (post.status === 'pending') {
        console.log('   ⏳ まだペンディング中です');
      }
      
      return post;
    } else {
      console.log('❌ 投稿が見つかりません');
      return null;
    }
  } catch (error) {
    console.error('❌ ステータス確認エラー:', error);
    return null;
  }
}

// メインのテスト実行
async function runTest() {
  console.log('🚀 スケジュール投稿の実行テストを開始\n');
  console.log('=' .repeat(50));
  
  // 1. ペンディング投稿を確認
  const pendingPost = await checkPendingPosts();
  
  if (!pendingPost) {
    console.log('\n❌ ペンディング中の投稿がありません');
    console.log('   先にスケジュール登録をしてください');
    return;
  }
  
  // 2. スケジュール時刻を現在に変更（即座に実行可能にする）
  const updated = await updateScheduleToNow(pendingPost.id);
  
  if (!updated) {
    console.log('\n❌ スケジュール時刻の更新に失敗しました');
    return;
  }
  
  // 3. Cronジョブを手動実行
  const cronResult = await triggerCronJob();
  
  if (!cronResult) {
    console.log('\n⚠️ Cronジョブの実行に問題がありました');
    console.log('   X API認証情報が設定されているか確認してください:');
    console.log('   - X_API_KEY');
    console.log('   - X_API_KEY_SECRET');
    console.log('   - X_ACCESS_TOKEN');
    console.log('   - X_ACCESS_TOKEN_SECRET');
  }
  
  // 4. 少し待機してから結果を確認
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 5. 投稿結果を確認
  await checkPostStatus(pendingPost.id);
  
  console.log('\n' + '=' .repeat(50));
  console.log('テスト終了');
}

// テストを実行
runTest().catch(console.error);