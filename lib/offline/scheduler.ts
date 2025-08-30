'use client'

import { useEffect } from 'react'

// Service Workerの登録とオフラインスケジューラーの初期化
export function useOfflineScheduler() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Service Workerの登録
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.register('/sw.js')
        .then(async (registration) => {
          console.log('Service Worker registered:', registration)
          
          // Background Syncの登録
          try {
            await registration.sync.register('scheduled-posts-sync')
            console.log('Background sync registered')
          } catch (error) {
            console.error('Background sync registration failed:', error)
          }
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }
    
    // IndexedDBへのデータ同期
    syncToIndexedDB()
    
    // 定期的な同期（5分ごと）
    const interval = setInterval(() => {
      syncToIndexedDB()
    }, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])
}

// SupabaseのデータをIndexedDBに同期
async function syncToIndexedDB() {
  try {
    // Supabaseから投稿データを取得
    const response = await fetch('/api/scheduled-posts')
    if (!response.ok) return
    
    const { posts } = await response.json()
    
    // IndexedDBを開く
    const db = await openDB()
    const tx = db.transaction(['scheduled_posts'], 'readwrite')
    const store = tx.objectStore('scheduled_posts')
    
    // 既存のデータをクリア
    await store.clear()
    
    // 新しいデータを追加
    for (const post of posts) {
      await store.add(post)
    }
    
    console.log(`Synced ${posts.length} posts to IndexedDB`)
  } catch (error) {
    console.error('Failed to sync to IndexedDB:', error)
  }
}

// IndexedDB Helper
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('NoteSchedulerDB', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result
      
      if (!db.objectStoreNames.contains('scheduled_posts')) {
        db.createObjectStore('scheduled_posts', { keyPath: 'id' })
      }
      
      if (!db.objectStoreNames.contains('offline_queue')) {
        db.createObjectStore('offline_queue', { keyPath: 'id' })
      }
    }
  })
}

// オフラインステータスの監視
export function useOfflineStatus() {
  useEffect(() => {
    const handleOnline = () => {
      console.log('Back online - processing offline queue')
      // Service Workerにオンライン復帰を通知
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'ONLINE' })
      }
    }
    
    const handleOffline = () => {
      console.log('Gone offline - switching to offline mode')
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
}