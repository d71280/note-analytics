import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // 認証されていない場合は空の設定を返す（401エラーではなく）
      return NextResponse.json({ config: null })
    }
    
    const { data, error } = await supabase
      .from('x_api_configs')
      .select('api_key, api_key_secret, access_token, access_token_secret, username')
      .single()

    if (error || !data) {
      return NextResponse.json({ config: null })
    }

    // APIキーの一部をマスク
    const maskedConfig = {
      api_key: maskString(data.api_key),
      api_secret: maskString(data.api_key_secret),
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
    
    // 現在のユーザーを取得
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // 既存の設定を削除
    await supabase.from('x_api_configs').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // bearer_tokenを生成（Twitter API v2では通常access_tokenがbearer_tokenとして使用される）
    const bearer_token = access_token

    // 新しい設定を保存
    const { error } = await supabase
      .from('x_api_configs')
      .insert({
        user_id: user.id,
        api_key,
        api_key_secret: api_secret,
        access_token,
        access_token_secret,
        bearer_token
      })

    if (error) {
      console.error('Save config error:', error)
      console.error('Error details:', error.message, error.code)
      return NextResponse.json(
        { error: `Failed to save configuration: ${error.message}` },
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