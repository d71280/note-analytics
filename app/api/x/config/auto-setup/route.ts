import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    console.log('Auto-setup API called')
    const supabase = createClient()
    
    // 環境変数から値を取得
    const xApiKey = process.env.X_API_KEY
    const xApiSecret = process.env.X_API_SECRET
    const xAccessToken = process.env.X_ACCESS_TOKEN
    const xAccessSecret = process.env.X_ACCESS_SECRET
    
    console.log('Environment variables check:', {
      hasApiKey: !!xApiKey,
      hasApiSecret: !!xApiSecret,
      hasAccessToken: !!xAccessToken,
      hasAccessSecret: !!xAccessSecret
    })

    if (!xApiKey || !xApiSecret || !xAccessToken || !xAccessSecret) {
      return NextResponse.json(
        { error: 'X API credentials not found in environment variables' },
        { status: 400 }
      )
    }

    // 既存の設定を確認
    const { data: existing } = await supabase
      .from('x_api_configs')
      .select('*')
      .single()

    if (existing) {
      // 更新
      const { error } = await supabase
        .from('x_api_configs')
        .update({
          api_key: xApiKey,
          api_secret: xApiSecret,
          access_token: xAccessToken,
          access_token_secret: xAccessSecret,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      // 新規作成
      const { error } = await supabase
        .from('x_api_configs')
        .insert({
          api_key: xApiKey,
          api_secret: xApiSecret,
          access_token: xAccessToken,
          access_token_secret: xAccessSecret
        })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    // Grok API設定も保存
    const grokApiKey = process.env.GROK_API_KEY
    if (grokApiKey) {
      const { data: existingGrok } = await supabase
        .from('grok_api_configs')
        .select('*')
        .single()

      if (existingGrok) {
        await supabase
          .from('grok_api_configs')
          .update({
            api_key: grokApiKey,
            enabled: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingGrok.id)
      } else {
        await supabase
          .from('grok_api_configs')
          .insert({
            api_key: grokApiKey,
            enabled: true
          })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Auto setup error:', error)
    return NextResponse.json(
      { error: 'Failed to auto setup API configurations' },
      { status: 500 }
    )
  }
}