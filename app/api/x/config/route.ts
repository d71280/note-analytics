import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('x_api_configs')
      .select('api_key, api_secret, access_token, access_token_secret, username')
      .single()

    if (error || !data) {
      return NextResponse.json({ config: null })
    }

    // APIキーの一部をマスク
    const maskedConfig = {
      api_key: maskString(data.api_key),
      api_secret: maskString(data.api_secret),
      access_token: maskString(data.access_token),
      access_token_secret: maskString(data.access_token_secret),
      username: data.username
    }

    return NextResponse.json({ config: maskedConfig })
  } catch (error) {
    console.error('Get config error:', error)
    return NextResponse.json({ config: null })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { api_key, api_secret, access_token, access_token_secret } = body

    if (!api_key || !api_secret || !access_token || !access_token_secret) {
      return NextResponse.json(
        { error: 'All API credentials are required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // 既存の設定を削除
    await supabase.from('x_api_configs').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // 新しい設定を保存
    const { error } = await supabase
      .from('x_api_configs')
      .insert({
        api_key,
        api_secret,
        access_token,
        access_token_secret
      })

    if (error) {
      console.error('Save config error:', error)
      return NextResponse.json(
        { error: 'Failed to save configuration' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save config error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('x_api_configs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (error) {
      console.error('Delete config error:', error)
      return NextResponse.json(
        { error: 'Failed to delete configuration' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete config error:', error)
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