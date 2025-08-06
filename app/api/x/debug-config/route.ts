import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // X API設定を取得（ユーザーIDフィルタなし）
    const { data: configs, error: configError } = await supabase
      .from('x_api_configs')
      .select('*')
    
    if (configError) {
      return NextResponse.json({
        error: 'Failed to fetch configs',
        details: configError.message,
        code: configError.code
      }, { status: 500 })
    }
    
    // 現在のユーザーを取得
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    return NextResponse.json({
      configs: configs?.map(config => ({
        id: config.id,
        user_id: config.user_id,
        has_access_token: !!config.access_token,
        has_bearer_token: !!config.bearer_token,
        created_at: config.created_at,
        updated_at: config.updated_at
      })),
      current_user: user?.id || 'Not authenticated',
      total_configs: configs?.length || 0
    })
    
  } catch (error) {
    console.error('Debug config error:', error)
    return NextResponse.json(
      { error: 'Failed to debug X API config' },
      { status: 500 }
    )
  }
}