// Service Worker for offline scheduling
const CACHE_NAME = 'note-scheduler-v1';
const OFFLINE_QUEUE = 'offline-posts-queue';

// キャッシュするリソース
const urlsToCache = [
  '/',
  '/scheduled-posts',
  '/api/scheduled-posts',
];

// インストール時
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Background Sync API を使用した定期実行
self.addEventListener('sync', async (event) => {
  if (event.tag === 'scheduled-posts-sync') {
    event.waitUntil(processScheduledPosts());
  }
});

// 定期的なスケジュール確認
async function processScheduledPosts() {
  try {
    // IndexedDBから保留中の投稿を取得
    const db = await openDB();
    const tx = db.transaction(['scheduled_posts'], 'readonly');
    const store = tx.objectStore('scheduled_posts');
    const posts = await store.getAll();
    
    const now = new Date();
    const pendingPosts = posts.filter(post => 
      post.status === 'pending' && 
      new Date(post.scheduled_for) <= now
    );
    
    for (const post of pendingPosts) {
      try {
        // オンラインの場合は即座に投稿
        if (navigator.onLine) {
          await postToAPI(post);
        } else {
          // オフラインの場合はキューに追加
          await addToOfflineQueue(post);
        }
      } catch (error) {
        console.error('Failed to process post:', error);
      }
    }
  } catch (error) {
    console.error('Error in processScheduledPosts:', error);
  }
}

// オフラインキューに追加
async function addToOfflineQueue(post) {
  const db = await openDB();
  const tx = db.transaction(['offline_queue'], 'readwrite');
  const store = tx.objectStore('offline_queue');
  await store.add({
    ...post,
    queued_at: new Date().toISOString()
  });
}

// ネットワーク復帰時の処理
self.addEventListener('online', async () => {
  const db = await openDB();
  const tx = db.transaction(['offline_queue'], 'readonly');
  const store = tx.objectStore('offline_queue');
  const queuedPosts = await store.getAll();
  
  for (const post of queuedPosts) {
    try {
      await postToAPI(post);
      // 成功したらキューから削除
      const deleteTx = db.transaction(['offline_queue'], 'readwrite');
      await deleteTx.objectStore('offline_queue').delete(post.id);
    } catch (error) {
      console.error('Failed to post queued item:', error);
    }
  }
});

// APIへの投稿
async function postToAPI(post) {
  const endpoint = `/api/${post.platform}/post`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: post.content,
      postType: 'scheduled',
      metadata: post.metadata
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to post: ${response.statusText}`);
  }
  
  return response.json();
}

// IndexedDB Helper
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('NoteSchedulerDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('scheduled_posts')) {
        db.createObjectStore('scheduled_posts', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('offline_queue')) {
        db.createObjectStore('offline_queue', { keyPath: 'id' });
      }
    };
  });
}