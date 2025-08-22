// 自動スケジュール実行器
// アプリケーション起動時に自動的に開始され、定期的にスケジュール投稿をチェックして実行します

import { createAdminClient } from '@/lib/supabase/admin'
import { postToXDirect, postToNoteDirect, postToWordPressDirect } from '@/lib/post-to-platforms'

let intervalId: NodeJS.Timeout | null = null
let isRunning = false

// スケジュール投稿を処理する関数
async function processScheduledPosts() {
  if (isRunning) {
    console.log('[AutoRunner] Already running, skipping...')
    return
  }

  isRunning = true
  console.log('[AutoRunner] Checking for scheduled posts...')

  try {
    const supabase = createAdminClient()
    const now = new Date()

    // 投稿時刻が過ぎている投稿を取得
    const { data: scheduledPosts, error } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(5) // 一度に処理する最大数

    if (error) {
      console.error('[AutoRunner] Failed to fetch scheduled posts:', error)
      return
    }

    if (!scheduledPosts || scheduledPosts.length === 0) {
      console.log('[AutoRunner] No scheduled posts to process')
      return
    }

    console.log(`[AutoRunner] Found ${scheduledPosts.length} posts to process`)

    // 各投稿を処理
    for (const post of scheduledPosts) {
      try {
        console.log(`[AutoRunner] Processing post ${post.id} for ${post.platform}`)
        
        let result = null
        
        switch (post.platform) {
          case 'x':
            result = await postToXDirect(post.content, post.metadata)
            break
          case 'note':
            result = await postToNoteDirect(post.content, post.metadata)
            break
          case 'wordpress':
            result = await postToWordPressDirect(post.content, post.metadata)
            break
          default:
            console.error(`[AutoRunner] Unknown platform: ${post.platform}`)
            continue
        }

        if (result.success) {
          // 投稿成功
          await supabase
            .from('scheduled_posts')
            .update({
              status: 'posted',
              metadata: {
                ...post.metadata,
                posted_at: now.toISOString(),
                post_id: result.postId
              }
            })
            .eq('id', post.id)

          console.log(`[AutoRunner] ✅ Successfully posted to ${post.platform}`)
        } else {
          // 投稿失敗
          await supabase
            .from('scheduled_posts')
            .update({
              status: 'failed',
              metadata: {
                ...post.metadata,
                failed_at: now.toISOString(),
                error: result.error
              }
            })
            .eq('id', post.id)

          console.error(`[AutoRunner] ❌ Failed to post to ${post.platform}:`, result.error)
        }

        // レート制限対策
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        console.error(`[AutoRunner] Error processing post ${post.id}:`, error)
      }
    }
  } catch (error) {
    console.error('[AutoRunner] Critical error:', error)
  } finally {
    isRunning = false
  }
}

// スケジューラーを開始
export function startScheduler(intervalMinutes: number = 1) {
  if (intervalId) {
    console.log('[AutoRunner] Scheduler already running')
    return
  }

  // 初回実行
  processScheduledPosts()

  // 定期実行を設定
  intervalId = setInterval(() => {
    processScheduledPosts()
  }, intervalMinutes * 60 * 1000)

  console.log(`[AutoRunner] Scheduler started with ${intervalMinutes} minute interval`)
}

// スケジューラーを停止
export function stopScheduler() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
    console.log('[AutoRunner] Scheduler stopped')
  }
}

// 手動実行
export async function runSchedulerOnce() {
  console.log('[AutoRunner] Manual run triggered')
  await processScheduledPosts()
}

// プロセス終了時にクリーンアップ
if (typeof process !== 'undefined') {
  process.on('SIGINT', () => {
    stopScheduler()
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    stopScheduler()
    process.exit(0)
  })
}