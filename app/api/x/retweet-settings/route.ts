import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('x_retweet_settings')
      .select('*')
      .single()

    if (error || !data) {
      // デフォルト設定を返す
      return NextResponse.json({ 
        settings: {
          enabled: false,
          search_keywords: [],
          min_likes: 0,
          min_retweets: 0,
          retweet_note_mentions: false
        }
      })
    }

    // x_post_settingsからも設定を取得
    const { data: postSettings } = await supabase
      .from('x_post_settings')
      .select('retweet_note_mentions')
      .single()

    return NextResponse.json({ 
      settings: {
        enabled: data.enabled,
        search_keywords: data.search_keywords || [],
        min_likes: data.min_likes || 0,
        min_retweets: data.min_retweets || 0,
        retweet_note_mentions: postSettings?.retweet_note_mentions || false
      }
    })
  } catch (error) {
    console.error('Get retweet settings error:', error)
    return NextResponse.json({ 
      settings: {
        enabled: false,
        search_keywords: [],
        min_likes: 0,
        min_retweets: 0,
        retweet_note_mentions: false
      }
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { enabled, search_keywords, min_likes, min_retweets, retweet_note_mentions } = body

    const supabase = createClient()

    // リツイート設定を更新または作成
    const { data: existing } = await supabase
      .from('x_retweet_settings')
      .select('id')
      .single()

    if (existing) {
      // 更新
      const { error } = await supabase
        .from('x_retweet_settings')
        .update({
          enabled,
          search_keywords,
          min_likes,
          min_retweets,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (error) {
        console.error('Update retweet settings error:', error)
        return NextResponse.json(
          { error: 'Failed to update settings' },
          { status: 500 }
        )
      }
    } else {
      // 新規作成
      const { error } = await supabase
        .from('x_retweet_settings')
        .insert({
          enabled,
          search_keywords,
          min_likes,
          min_retweets
        })

      if (error) {
        console.error('Create retweet settings error:', error)
        return NextResponse.json(
          { error: 'Failed to create settings' },
          { status: 500 }
        )
      }
    }

    // x_post_settingsも更新
    const { data: postSettingsExist } = await supabase
      .from('x_post_settings')
      .select('id')
      .single()

    if (postSettingsExist) {
      await supabase
        .from('x_post_settings')
        .update({ retweet_note_mentions })
        .eq('id', postSettingsExist.id)
    } else {
      await supabase
        .from('x_post_settings')
        .insert({ retweet_note_mentions })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save retweet settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}