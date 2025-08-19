import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const now = new Date()

    // 実行待ちの予約投稿を取得
    const { data: scheduledPosts, error } = await supabase
      .from('x_scheduled_posts')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', now.toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(5) // API制限を考慮

    if (error || !scheduledPosts || scheduledPosts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No posts to execute'
      })
    }

    const results = []

    for (const post of scheduledPosts) {
      try {
        let tweetContent = ''

        if (post.post_type === 'tweet') {
          // コンテンツソースに基づいてツイートを生成
          if (post.content_source?.useTrends) {
            // トレンドデータを取得
            const trendsResponse = await fetch(`${request.nextUrl.origin}/api/trends/daily`)
            const trendsData = await trendsResponse.json()
            
            if (post.ai_generated) {
              // AI生成
              const aiResponse = await fetch(`${request.nextUrl.origin}/api/x/generate-tweet`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'trend',
                  data: trendsData.trends?.slice(0, 3) || [],
                  useGrok: true,
                  prompt: post.content_source.customPrompt
                })
              })
              const aiData = await aiResponse.json()
              tweetContent = aiData.tweet
            } else {
              // テンプレート生成
              const topTrends = trendsData.trends?.slice(0, 3) || []
              tweetContent = `📊 本日のnoteトレンド\n\n`
              topTrends.forEach((trend: { keyword: string; count: number }, index: number) => {
                tweetContent += `${index + 1}. ${trend.keyword} (${trend.count}件)\n`
              })
              tweetContent += `\n#note #トレンド分析`
            }
          } else if (post.content_source?.useTopArticles) {
            // 人気記事を取得
            const articlesResponse = await fetch(`${request.nextUrl.origin}/api/analyze/top`)
            const articlesData = await articlesResponse.json()
            const topArticle = articlesData.articles?.[0]
            
            if (topArticle) {
              if (post.ai_generated) {
                // AI生成
                const aiResponse = await fetch(`${request.nextUrl.origin}/api/x/generate-tweet`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'article',
                    data: topArticle,
                    useGrok: true,
                    prompt: post.content_source.customPrompt
                  })
                })
                const aiData = await aiResponse.json()
                tweetContent = aiData.tweet
              } else {
                // テンプレート生成
                tweetContent = `🎯 注目記事\n\n「${topArticle.title}」\n著者: ${topArticle.author}\n\n${topArticle.url}\n\n#note #注目記事`
              }
            }
          } else if (post.content) {
            // カスタムコンテンツ
            tweetContent = post.content
          }

          if (tweetContent) {
            // ツイートを投稿
            const postResponse = await fetch(`${request.nextUrl.origin}/api/x/post`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: tweetContent,
                postType: 'scheduled'
              })
            })

            if (postResponse.ok) {
              await supabase
                .from('x_scheduled_posts')
                .update({
                  status: 'posted',
                  posted_at: new Date().toISOString()
                })
                .eq('id', post.id)
              
              results.push({ id: post.id, success: true })
            } else {
              throw new Error('Failed to post tweet')
            }
          }
        } else if (post.post_type === 'retweet' && post.tweet_id) {
          // リツイート実行
          const retweetResponse = await fetch(`${request.nextUrl.origin}/api/x/retweet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tweetId: post.tweet_id,
              action: 'retweet'
            })
          })

          if (retweetResponse.ok) {
            await supabase
              .from('x_scheduled_posts')
              .update({
                status: 'posted',
                posted_at: new Date().toISOString()
              })
              .eq('id', post.id)
            
            results.push({ id: post.id, success: true })
          } else {
            throw new Error('Failed to retweet')
          }
        }

        // レート制限対策
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        console.error(`Failed to execute post ${post.id}:`, error)
        
        await supabase
          .from('x_scheduled_posts')
          .update({
            status: 'failed',
            error_message: (error as Error).message
          })
          .eq('id', post.id)
        
        results.push({ id: post.id, success: false, error: (error as Error).message })
      }
    }

    // 次回分の予約を作成
    await createNextScheduledPosts()

    return NextResponse.json({
      success: true,
      executed: results.length,
      results
    })
  } catch (error) {
    console.error('Schedule executor error:', error)
    return NextResponse.json(
      { error: 'Failed to execute scheduled posts' },
      { status: 500 }
    )
  }
}

async function createNextScheduledPosts() {
  const supabase = createAdminClient()
  
  // アクティブなスケジュールを取得
  const { data: schedules } = await supabase
    .from('x_post_schedules')
    .select('*')
    .eq('enabled', true)

  if (!schedules) return

  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  for (const schedule of schedules) {
    // 明日の予約を作成
    const dayOfWeek = tomorrow.getDay() || 7
    if (schedule.weekdays.includes(dayOfWeek)) {
      const scheduledPosts = schedule.time_slots.map((time: string) => {
        const [hours, minutes] = time.split(':').map(Number)
        const scheduledAt = new Date(tomorrow)
        scheduledAt.setHours(hours, minutes, 0, 0)
        
        return {
          post_type: schedule.schedule_type === 'post' ? 'tweet' : 'retweet',
          scheduled_at: scheduledAt.toISOString(),
          ai_generated: schedule.content_source?.useAI || false,
          content_source: schedule.content_source
        }
      })

      await supabase
        .from('x_scheduled_posts')
        .insert(scheduledPosts)
    }
  }
}