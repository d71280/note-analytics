'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

interface ScheduledPost {
  id: string
  platform: string
  content: string
  status: string
  scheduled_for: string
  metadata: Record<string, unknown>
}

interface PostResponse {
  postId?: string
  tweetId?: string
}

// オンライン/オフラインの両方で動作するハイブリッドスケジューラー
export function HybridScheduler() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  
  // IndexedDB Helper
  const openDB = useCallback((): Promise<IDBDatabase> => {
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
  }, [])
  
  // オフラインキューに追加
  const addToOfflineQueue = useCallback(async (post: ScheduledPost) => {
    const db = await openDB()
    const tx = db.transaction(['offline_queue'], 'readwrite')
    const store = tx.objectStore('offline_queue')
    
    return new Promise((resolve, reject) => {
      const request = store.add({
        ...post,
        queued_at: new Date().toISOString()
      })
      request.onsuccess = resolve
      request.onerror = () => reject(request.error)
    })
  }, [openDB])
  
  // 投稿の処理
  const processPost = useCallback(async (post: ScheduledPost, online: boolean) => {
    try {
      if (online) {
        // オンライン時は直接API呼び出し
        const response = await fetch(`/api/${post.platform}/post`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: post.content,
            postType: 'scheduled',
            metadata: post.metadata
          })
        })
        
        if (response.ok) {
          const data: PostResponse = await response.json()
          
          // ステータス更新
          await supabase
            .from('scheduled_posts')
            .update({
              status: 'posted',
              metadata: {
                ...post.metadata,
                posted_at: new Date().toISOString(),
                post_id: data.postId || data.tweetId
              }
            })
            .eq('id', post.id)
          
          console.log(`✅ Posted successfully: ${post.id}`)
        } else {
          throw new Error('Failed to post')
        }
      } else {
        // オフライン時はキューに追加
        await addToOfflineQueue(post)
        console.log(`📦 Added to offline queue: ${post.id}`)
      }
    } catch (error) {
      console.error(`Failed to process post ${post.id}:`, error)
      
      // エラー時のステータス更新（オンラインの場合のみ）
      if (online) {
        await supabase
          .from('scheduled_posts')
          .update({
            status: 'failed',
            metadata: {
              ...post.metadata,
              failed_at: new Date().toISOString(),
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          })
          .eq('id', post.id)
      }
    }
  }, [addToOfflineQueue])
  
  // オフライン投稿の処理
  const processOfflinePosts = useCallback(async () => {
    try {
      const db = await openDB()
      const tx = db.transaction(['scheduled_posts'], 'readonly')
      const store = tx.objectStore('scheduled_posts')
      const posts = await new Promise<ScheduledPost[]>((resolve, reject) => {
        const request = store.getAll()
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
      
      const now = new Date()
      const pendingPosts = posts.filter((post: ScheduledPost) => 
        post.status === 'pending' && 
        new Date(post.scheduled_for) <= now
      )
      
      for (const post of pendingPosts) {
        await processPost(post, false)
      }
    } catch (error) {
      console.error('Failed to process offline posts:', error)
    }
  }, [openDB, processPost])
  
  useEffect(() => {
    // オンライン状態の監視
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }
    
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    // スケジュール投稿の処理
    const processScheduledPosts = async () => {
      try {
        const now = new Date()
        
        if (navigator.onLine) {
          // オンライン時：通常のSupabase経由で処理
          const { data: posts } = await supabase
            .from('scheduled_posts')
            .select('*')
            .eq('status', 'pending')
            .lte('scheduled_for', now.toISOString())
            .limit(5)
          
          if (posts && posts.length > 0) {
            console.log(`[HybridScheduler] Processing ${posts.length} posts (online)`)
            
            for (const post of posts) {
              await processPost(post as ScheduledPost, true)
              await new Promise(resolve => setTimeout(resolve, 2000))
            }
          }
        } else {
          // オフライン時：IndexedDBから処理
          console.log('[HybridScheduler] Processing in offline mode')
          await processOfflinePosts()
        }
      } catch (error) {
        console.error('[HybridScheduler] Error:', error)
      }
    }
    
    // 初回実行
    processScheduledPosts()
    
    // 定期実行（1分ごと）
    intervalRef.current = setInterval(processScheduledPosts, 60000)
    
    // クリーンアップ
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [processPost, processOfflinePosts])
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
        isOnline 
          ? 'bg-green-100 text-green-800' 
          : 'bg-yellow-100 text-yellow-800'
      }`}>
        {isOnline ? '🟢 Online' : '🟡 Offline Mode'}
      </div>
    </div>
  )
}