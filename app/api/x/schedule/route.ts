import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    const { data: schedules, error } = await supabase
      .from('x_post_schedules')
      .select('*')

    if (error) {
      console.error('Get schedules error:', error)
      return NextResponse.json({ schedules: [] })
    }

    return NextResponse.json({ schedules })
  } catch (error) {
    console.error('Get schedules error:', error)
    return NextResponse.json({ schedules: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { postSchedule, retweetSchedule } = await request.json()
    const supabase = createClient()

    // 既存のスケジュールを削除
    await supabase
      .from('x_post_schedules')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    // 新しいスケジュールを保存
    const schedulesToInsert = []

    if (postSchedule) {
      schedulesToInsert.push({
        schedule_type: 'post',
        enabled: postSchedule.enabled,
        time_slots: postSchedule.timeSlots.map((slot: any) => slot.time),
        weekdays: postSchedule.weekdays,
        content_source: postSchedule.contentSource
      })
    }

    if (retweetSchedule) {
      schedulesToInsert.push({
        schedule_type: 'retweet',
        enabled: retweetSchedule.enabled,
        time_slots: retweetSchedule.timeSlots.map((slot: any) => slot.time),
        weekdays: retweetSchedule.weekdays
      })
    }

    if (schedulesToInsert.length > 0) {
      const { error } = await supabase
        .from('x_post_schedules')
        .insert(schedulesToInsert)

      if (error) {
        console.error('Save schedules error:', error)
        return NextResponse.json(
          { error: 'Failed to save schedules' },
          { status: 500 }
        )
      }
    }

    // 次の実行時刻で予約投稿を作成
    await createScheduledPosts(postSchedule, retweetSchedule)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save schedules error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function createScheduledPosts(postSchedule: any, retweetSchedule: any) {
  const supabase = createClient()
  const now = new Date()
  const scheduledPosts = []

  // 投稿スケジュールから予約を作成
  if (postSchedule?.enabled) {
    for (const timeSlot of postSchedule.timeSlots) {
      const [hours, minutes] = timeSlot.time.split(':').map(Number)
      const scheduledTime = new Date(now)
      scheduledTime.setHours(hours, minutes, 0, 0)
      
      // 既に過ぎた時間なら翌日に設定
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1)
      }

      // 曜日チェック
      const dayOfWeek = scheduledTime.getDay() || 7 // 日曜日を7に変換
      if (postSchedule.weekdays.includes(dayOfWeek)) {
        scheduledPosts.push({
          post_type: 'tweet',
          scheduled_at: scheduledTime.toISOString(),
          ai_generated: postSchedule.contentSource?.useAI || false,
          content_source: postSchedule.contentSource
        })
      }
    }
  }

  if (scheduledPosts.length > 0) {
    await supabase
      .from('x_scheduled_posts')
      .insert(scheduledPosts)
  }
}