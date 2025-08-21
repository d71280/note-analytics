// スケジュール投稿を即座に実行するテスト

const BASE_URL = 'http://localhost:3000';

async function executeScheduledPost() {
  console.log('🚀 スケジュール投稿の即時実行テスト\n');
  console.log('=' .repeat(50));
  
  try {
    // 1. テスト投稿IDを指定（先ほど作成したもの）
    const postId = '31be6b0d-c969-4671-8266-1e8d2098129f';
    
    // 2. スケジュール時刻を5分前に設定
    const pastTime = new Date(Date.now() - 5 * 60 * 1000);
    console.log(`\n⏰ スケジュール時刻を過去に設定: ${pastTime.toLocaleString('ja-JP')}`);
    
    const updateRes = await fetch(`${BASE_URL}/api/gpts/contents/${postId}/schedule`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduled_for: pastTime.toISOString() })
    });
    
    const updateData = await updateRes.json();
    
    if (!updateRes.ok) {
      console.error('❌ スケジュール更新失敗:', updateData);
      return;
    }
    
    console.log('✅ スケジュール時刻を更新しました');
    
    // 3. スケジュール投稿を処理
    console.log('\n🔄 スケジュール投稿を処理中...');
    
    const processRes = await fetch(`${BASE_URL}/api/test/process-scheduled`);
    const processData = await processRes.json();
    
    console.log('\n📊 処理結果:');
    
    if (processData.results && processData.results.length > 0) {
      processData.results.forEach(result => {
        console.log(`\n投稿ID: ${result.id}`);
        console.log(`ステータス: ${result.status}`);
        
        if (result.status === 'posted') {
          console.log('✅ 投稿成功！');
          if (result.response) {
            console.log('レスポンス:', result.response);
          }
        } else if (result.status === 'failed') {
          console.log('❌ 投稿失敗');
          console.log('エラー詳細:', result.error);
          
          // X API認証エラーの場合のヒント
          if (result.error?.error?.includes('OAuth') || result.error?.error?.includes('認証')) {
            console.log('\n⚠️ X API認証情報を確認してください:');
            console.log('   環境変数 (.env.local) に以下を設定:');
            console.log('   - X_API_KEY');
            console.log('   - X_API_KEY_SECRET');
            console.log('   - X_ACCESS_TOKEN');
            console.log('   - X_ACCESS_TOKEN_SECRET');
            console.log('\n   X Developer Portalで:');
            console.log('   1. アプリの権限を "Read and Write" に設定');
            console.log('   2. Access Token & Secretを再生成');
          }
        }
      });
      
      console.log('\n📈 サマリー:');
      if (processData.summary) {
        console.log(`   成功: ${processData.summary.posted}件`);
        console.log(`   失敗: ${processData.summary.failed}件`);
        console.log(`   スキップ: ${processData.summary.skipped}件`);
      }
    } else {
      console.log('ℹ️ 処理対象の投稿がありませんでした');
      console.log('詳細:', processData);
    }
    
  } catch (error) {
    console.error('\n❌ テスト実行エラー:', error);
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('テスト終了');
}

// テストを実行
executeScheduledPost().catch(console.error);