'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface SchedulerStatus {
  isRunning: boolean
  lastCheck: string | null
  nextCheck: string | null
  environment: 'production' | 'development'
}

// 本番環境用のスケジューラーステータス表示
export function ProductionScheduler() {
  const [status, setStatus] = useState<SchedulerStatus>({
    isRunning: false,
    lastCheck: null,
    nextCheck: null,
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
  })
  
  useEffect(() => {
    // 本番環境ではVercel Cron Jobsが動作
    if (process.env.NODE_ENV === 'production') {
      checkSchedulerStatus()
      
      // 5分ごとにステータスを更新（表示のみ）
      const interval = setInterval(checkSchedulerStatus, 5 * 60 * 1000)
      return () => clearInterval(interval)
    } else {
      // 開発環境では簡易的なクライアントサイドスケジューラー
      runLocalScheduler()
    }
  }, [])
  
  // スケジューラーのステータスを確認
  const checkSchedulerStatus = async () => {
    try {
      // 最新の投稿状態を確認
      const { data: latestPost } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('status', 'posted')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (latestPost) {
        const lastCheck = new Date(latestPost.created_at)
        const nextCheck = new Date(lastCheck.getTime() + 5 * 60 * 1000)
        
        setStatus(prev => ({
          ...prev,
          isRunning: true,
          lastCheck: lastCheck.toLocaleString('ja-JP'),
          nextCheck: nextCheck.toLocaleString('ja-JP')
        }))
      }
    } catch (error) {
      console.error('Failed to check scheduler status:', error)
    }
  }
  
  // 開発環境用のローカルスケジューラー
  const runLocalScheduler = () => {
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
          console.log(`[LocalScheduler] ${posts.length}件の投稿を処理`)
          
          for (const post of posts) {
            try {
              // 開発環境でのテスト投稿
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
                await supabase
                  .from('scheduled_posts')
                  .update({
                    status: 'posted',
                    metadata: {
                      ...post.metadata,
                      posted_at: now.toISOString()
                    }
                  })
                  .eq('id', post.id)
                
                console.log(`✅ 投稿成功: ${post.id}`)
              }
              
              // レート制限対策
              await new Promise(resolve => setTimeout(resolve, 2000))
            } catch (error) {
              console.error(`エラー: ${post.id}`, error)
            }
          }
        }
        
        setStatus(prev => ({
          ...prev,
          isRunning: true,
          lastCheck: now.toLocaleString('ja-JP'),
          nextCheck: new Date(now.getTime() + 60000).toLocaleString('ja-JP')
        }))
      } catch (error) {
        console.error('[LocalScheduler] エラー:', error)
      }
    }
    
    // 初回実行
    checkAndPost()
    
    // 1分ごとに実行（開発環境のみ）
    const interval = setInterval(checkAndPost, 60000)
    
    return () => clearInterval(interval)
  }
  
  // 本番環境では状態表示のみ、開発環境では動作状態も表示
  if (status.environment === 'production') {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
          🚀 Vercel Cron Jobs稼働中
        </div>
      </div>
    )
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
        🔧 開発モード（ローカルスケジューラー）
      </div>
    </div>
  )
}