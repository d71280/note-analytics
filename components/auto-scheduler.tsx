'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

export function AutoScheduler() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    
    // 1分ごとにチェック
    const checkAndPost = async () => {
      try {
        const now = new Date()
        
        // 投稿時刻が過ぎているものを取得
        const { data: posts } = await supabase
          .from('scheduled_posts')
          .select('*')
          .eq('status', 'pending')
          .lte('scheduled_for', now.toISOString())
          .limit(5)
        
        if (posts && posts.length > 0) {
          console.log(`[AutoScheduler] ${posts.length}件の投稿を処理`)
          
          for (const post of posts) {
            try {
              // 直接投稿APIを呼び出し（これは成功実績あり）
              const response = await fetch('/api/x/post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  text: post.content,
                  postType: 'scheduled',
                  metadata: post.metadata
                })
              })
              
              if (response.ok) {
                const data = await response.json()
                
                // 成功したらステータス更新
                await supabase
                  .from('scheduled_posts')
                  .update({
                    status: 'posted',
                    metadata: {
                      ...post.metadata,
                      posted_at: now.toISOString(),
                      tweet_id: data.tweetId
                    }
                  })
                  .eq('id', post.id)
                
                console.log(`✅ 投稿成功: ${post.id}`)
              } else {
                const error = await response.json()
                
                // 失敗したらステータス更新
                await supabase
                  .from('scheduled_posts')
                  .update({
                    status: 'failed',
                    metadata: {
                      ...post.metadata,
                      failed_at: now.toISOString(),
                      error: error.error
                    }
                  })
                  .eq('id', post.id)
                
                console.error(`❌ 投稿失敗: ${post.id}`, error)
              }
              
              // レート制限対策
              await new Promise(resolve => setTimeout(resolve, 2000))
            } catch (error) {
              console.error(`エラー: ${post.id}`, error)
            }
          }
        }
      } catch (error) {
        console.error('[AutoScheduler] エラー:', error)
      }
    }
    
    // 初回実行
    checkAndPost()
    
    // 1分ごとに実行
    intervalRef.current = setInterval(checkAndPost, 60000)
    
    // クリーンアップ
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])
  
  return null // UIは表示しない
}