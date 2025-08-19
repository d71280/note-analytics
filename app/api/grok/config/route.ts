import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('grok_api_configs')
      .select('api_key, enabled')
      .single()

    if (error || !data) {
      return NextResponse.json({ 
        config: {
          api_key: '',
          enabled: false
        }
      })
    }

    // APIキーの一部をマスク
    const maskedConfig = {
      api_key: maskString(data.api_key),
      enabled: data.enabled
    }

    return NextResponse.json({ config: maskedConfig })
  } catch (error) {
    console.error('Get Grok config error:', error)
    return NextResponse.json({ 
      config: {
        api_key: '',
        enabled: false
      }
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { api_key, enabled } = body

    if (enabled && !api_key) {
      return NextResponse.json(
        { error: 'API key is required when enabled' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // 既存の設定を削除
    await supabase.from('grok_api_configs').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // 新しい設定を保存
    const { error } = await supabase
      .from('grok_api_configs')
      .insert({
        api_key: api_key || '',
        enabled
      })

    if (error) {
      console.error('Save Grok config error:', error)
      return NextResponse.json(
        { error: 'Failed to save configuration' },
        { status: 500 }
      )
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

function maskString(str: string): string {
  if (!str || str.length < 8) return '****'
  return str.substring(0, 4) + '****' + str.substring(str.length - 4)
}