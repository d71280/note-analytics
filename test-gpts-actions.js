// 統合エンドポイントのテスト
const BASE_URL = 'https://note-analytics.vercel.app';

async function testGptsActions() {
  console.log('🚀 統合エンドポイントのテスト開始...\n');
  console.log('URL:', BASE_URL);
  console.log('=' .repeat(50));
  
  // 1. GPTsコンテンツを作成
  console.log('\n📝 STEP 1: GPTsコンテンツを作成');
  console.log('-'.repeat(30));
  
  const testContent = `【統合エンドポイントテスト ${new Date().toLocaleTimeString('ja-JP')}】これは新しい統合エンドポイントの動作確認用テストです。#GPTsActions`;
  
  try {
    const createUrl = `${BASE_URL}/api/gpts/universal?action=save&content=${encodeURIComponent(testContent)}&platform=x`;
    console.log('送信中...');
    
    const createResponse = await fetch(createUrl, {
      method: 'GET',
      mode: 'cors'
    });
    
    let createdId = null;
    
    if (createResponse.ok) {
      const createData = await createResponse.json();
      createdId = createData.contentId;
      console.log('✅ 作成成功!');
      console.log('   ID:', createdId);
      console.log('   Platform:', createData.platform);
    } else {
      console.log('❌ 作成失敗:', createResponse.status, createResponse.statusText);
      return;
    }
    
    // 2. 統合エンドポイントでスケジュール設定
    console.log('\n⏰ STEP 2: 統合エンドポイントでスケジュール設定');
    console.log('-'.repeat(30));
    
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const scheduleResponse = await fetch(`${BASE_URL}/api/gpts-actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      body: JSON.stringify({
        action: 'schedule',
        id: createdId,
        data: {
          scheduled_for: tomorrow.toISOString(),
          status: 'pending'
        }
      })
    });
    
    if (scheduleResponse.ok) {
      const scheduleData = await scheduleResponse.json();
      console.log('✅ スケジュール設定成功!');
      if (scheduleData.data) {
        console.log('   予定時刻:', new Date(scheduleData.data.scheduled_for).toLocaleString('ja-JP'));
        console.log('   Status:', scheduleData.data.status);
      }
    } else {
      console.log('❌ スケジュール設定失敗:', scheduleResponse.status);
      const errorText = await scheduleResponse.text();
      console.log('   エラー:', errorText.substring(0, 200));
    }
    
    // 3. スケジュール解除
    console.log('\n🔄 STEP 3: スケジュール解除');
    console.log('-'.repeat(30));
    
    const unscheduleResponse = await fetch(`${BASE_URL}/api/gpts-actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      body: JSON.stringify({
        action: 'schedule',
        id: createdId,
        data: {
          scheduled_for: null,
          status: 'draft'
        }
      })
    });
    
    if (unscheduleResponse.ok) {
      console.log('✅ スケジュール解除成功!');
    } else {
      console.log('❌ スケジュール解除失敗:', unscheduleResponse.status);
    }
    
    // 4. 削除
    console.log('\n🗑️ STEP 4: 削除');
    console.log('-'.repeat(30));
    
    const deleteResponse = await fetch(`${BASE_URL}/api/gpts-actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      body: JSON.stringify({
        action: 'delete',
        id: createdId
      })
    });
    
    if (deleteResponse.ok) {
      console.log('✅ 削除成功!');
    } else {
      console.log('❌ 削除失敗:', deleteResponse.status);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 テスト完了!');
    
  } catch (error) {
    console.error('❌ エラー発生:', error);
  }
}

// 実行
testGptsActions();