import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    console.log('Auto-setup API called')
    const supabase = createClient()
    
    // 環境変数から値を取得（X_API_KEY_SECRETもサポート）
    const xApiKey = process.env.X_API_KEY
    const xApiSecret = process.env.X_API_SECRET || process.env.X_API_KEY_SECRET
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
        { 
          error: 'X API credentials not found in environment variables',
          details: {
            hasApiKey: !!xApiKey,
            hasApiSecret: !!xApiSecret,
            hasAccessToken: !!xAccessToken,
            hasAccessSecret: !!xAccessSecret
          }
        },
        { status: 400 }
      )
    }

    // 既存の設定を確認
    const { data: existing, error: selectError } = await supabase
      .from('x_api_configs')
      .select('*')
      .single()
    
    // テーブルが存在しない場合のエラーチェック
    if (selectError && selectError.code === '42P01') {
      return NextResponse.json({ 
        error: 'x_api_configs table does not exist. Please create the table first.',
        hint: 'Go to /admin/setup-tables to create the required tables.'
      }, { status: 500 })
    }

    // 一時的に認証チェックを無効化し、デフォルトユーザーIDを使用
    // TODO: 認証システム実装後に有効化
    // const { data: { user } } = await supabase.auth.getUser()
    // if (!user) {
    //   return NextResponse.json(
    //     { error: 'User not authenticated' },
    //     { status: 401 }
    //   )
    // }
    const user = { id: 'default-user' } // 一時的なデフォルトユーザー

    if (existing) {
      // 更新
      const { error } = await supabase
        .from('x_api_configs')
        .update({
          api_key: xApiKey,
          api_key_secret: xApiSecret,
          access_token: xAccessToken,
          access_token_secret: xAccessSecret,
          bearer_token: xAccessToken,
          user_id: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)

      if (error) {
        console.error('Update error:', error)
        return NextResponse.json({ error: `Failed to update config: ${error.message}` }, { status: 500 })
      }
    } else {
      // 新規作成
      const { error } = await supabase
        .from('x_api_configs')
        .insert({
          user_id: user.id,
          api_key: xApiKey,
          api_key_secret: xApiSecret,
          access_token: xAccessToken,
          access_token_secret: xAccessSecret,
          bearer_token: xAccessToken
        })

      if (error) {
        console.error('Update error:', error)
        return NextResponse.json({ error: `Failed to update config: ${error.message}` }, { status: 500 })
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
      { error: `Failed to auto setup API configurations: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}