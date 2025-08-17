let currentContent = null;

document.addEventListener('DOMContentLoaded', async () => {
  // 保存されたAPI URLを読み込む
  const result = await chrome.storage.local.get(['apiUrl']);
  if (result.apiUrl) {
    document.getElementById('api-url').value = result.apiUrl;
  } else {
    // デフォルトURL
    document.getElementById('api-url').value = 'https://note-analytics.vercel.app';
  }
  
  // 現在のタブがnote.comかチェック
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.url || (!tab.url.includes('note.com') && !tab.url.includes('note.mu'))) {
    showStatus('Note.comの記事ページで使用してください', 'warning');
    document.getElementById('get-content').disabled = true;
  }
});

// 記事内容を取得
document.getElementById('get-content').addEventListener('click', async () => {
  showLoading(true);
  hideStatus();
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // コンテンツスクリプトにメッセージを送信
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getContent' });
    
    if (response.error) {
      showStatus(response.error, 'error');
      showLoading(false);
      return;
    }
    
    if (response.content) {
      currentContent = response;
      showContentInfo(response);
      document.getElementById('send-content').style.display = 'block';
      document.getElementById('clear').style.display = 'block';
      showStatus('記事内容を取得しました', 'success');
    } else {
      showStatus('記事内容が見つかりませんでした', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showStatus('記事の取得に失敗しました。ページをリロードしてください。', 'error');
  }
  
  showLoading(false);
});

// Vercelアプリに送信
document.getElementById('send-content').addEventListener('click', async () => {
  if (!currentContent) {
    showStatus('送信する記事がありません', 'error');
    return;
  }
  
  const apiUrl = document.getElementById('api-url').value;
  if (!apiUrl) {
    showStatus('API URLを設定してください', 'error');
    return;
  }
  
  showLoading(true);
  hideStatus();
  
  try {
    // まずテスト用エンドポイントに送信
    const testUrl = `${apiUrl}/api/extension/receive`;
    console.log('Sending to:', testUrl);
    console.log('Content length:', currentContent.content.length);
    
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: currentContent.content,
        title: currentContent.title,
        url: currentContent.url,
        author: currentContent.author,
        publishedAt: currentContent.publishedAt
      })
    });
    
    const data = await response.json();
    console.log('Response:', data);
    
    if (response.ok && data.success) {
      showStatus('記事を送信しました！', 'success');
      
      // 本番用エンドポイントにも送信を試みる
      try {
        const prodUrl = `${apiUrl}/api/gpts/receive-note`;
        const prodResponse = await fetch(prodUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: currentContent.content,
            format: 'plain',
            metadata: {
              title: currentContent.title,
              description: currentContent.description || '',
              tags: currentContent.tags || []
            }
          })
        });
        
        if (prodResponse.ok) {
          const prodData = await prodResponse.json();
          console.log('Production endpoint response:', prodData);
          if (prodData.webUrl) {
            showStatus(`記事を保存しました！ ID: ${prodData.contentId}`, 'success');
          }
        }
      } catch (prodError) {
        console.log('Production endpoint error (non-critical):', prodError);
      }
    } else {
      showStatus(`送信失敗: ${data.error || 'Unknown error'}`, 'error');
    }
  } catch (error) {
    console.error('Send error:', error);
    showStatus(`送信エラー: ${error.message}`, 'error');
  }
  
  showLoading(false);
});

// クリア
document.getElementById('clear').addEventListener('click', () => {
  currentContent = null;
  document.getElementById('content-info').style.display = 'none';
  document.getElementById('send-content').style.display = 'none';
  document.getElementById('clear').style.display = 'none';
  hideStatus();
});

// 設定を保存
document.getElementById('save-settings').addEventListener('click', async () => {
  const apiUrl = document.getElementById('api-url').value;
  if (!apiUrl) {
    showStatus('API URLを入力してください', 'error');
    return;
  }
  
  await chrome.storage.local.set({ apiUrl });
  showStatus('設定を保存しました', 'success');
});

// ヘルパー関数
function showStatus(message, type) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  statusEl.style.display = 'block';
}

function hideStatus() {
  document.getElementById('status').style.display = 'none';
}

function showLoading(show) {
  document.getElementById('loading').style.display = show ? 'block' : 'none';
  document.getElementById('main-content').style.display = show ? 'none' : 'block';
}

function showContentInfo(content) {
  document.getElementById('content-info').style.display = 'block';
  document.getElementById('article-title').textContent = `タイトル: ${content.title || '取得できませんでした'}`;
  document.getElementById('article-length').textContent = `文字数: ${content.content.length}文字`;
}