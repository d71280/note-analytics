import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient()
    
    const { data: config, error } = await supabase
      .from('grok_api_configs')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116: no rows returned
      console.error('Get Grok config error:', error)
      return NextResponse.json({ config: null })
    }

    // 環境変数から設定を確認
    const hasEnvKey = !!process.env.GROK_API_KEY
    
    return NextResponse.json({ 
      config: config || { 
        api_key: hasEnvKey ? 'Configured in environment' : '', 
        enabled: false 
      }
    })
  } catch (error) {
    console.error('Get Grok config error:', error)
    return NextResponse.json({ config: null })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { api_key, enabled } = await request.json()
    const supabase = createAdminClient()

    // 既存の設定を確認
    const { data: existing } = await supabase
      .from('grok_api_configs')
      .select('*')
      .single()

    if (existing) {
      // 更新
      const { error } = await supabase
        .from('grok_api_configs')
        .update({
          api_key,
          enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (error) {
        console.error('Update Grok config error:', error)
        return NextResponse.json(
          { error: 'Failed to update Grok configuration' },
          { status: 500 }
        )
      }
    } else {
      // 新規作成
      const { error } = await supabase
        .from('grok_api_configs')
        .insert({
          api_key,
          enabled
        })

      if (error) {
        console.error('Insert Grok config error:', error)
        return NextResponse.json(
          { error: 'Failed to save Grok configuration' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save Grok config error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}