import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// APIキーの取得
export async function GET() {
  try {
    const supabase = createClient()
    
    // 設定テーブルからAPIキーを取得
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'gpts_api_key')
      .single()
    
    if (error || !data) {
      return NextResponse.json({ apiKey: null })
    }
    
    return NextResponse.json({ apiKey: data.value })
  } catch (error) {
    console.error('Failed to fetch API key:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API key' },
      { status: 500 }
    )
  }
}

// 新しいAPIキーの生成
export async function POST() {
  try {
    const supabase = createClient()
    
    // ランダムなAPIキーを生成
    const apiKey = `gpts_${crypto.randomBytes(32).toString('hex')}`
    
    // 設定テーブルに保存（upsert）
    const { error } = await supabase
      .from('settings')
      .upsert({
        key: 'gpts_api_key',
        value: apiKey,
        updated_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Failed to save API key:', error)
      return NextResponse.json(
        { error: 'Failed to save API key' },
        { status: 500 }
      )
    }
    
    // 環境変数にも設定（Vercelの場合）
    // この部分は手動で環境変数を設定する必要があります
    
    return NextResponse.json({ 
      apiKey,
      message: 'APIキーを生成しました。環境変数 GPTS_API_KEY にこの値を設定してください。'
    })
  } catch (error) {
    console.error('Failed to generate API key:', error)
    return NextResponse.json(
      { error: 'Failed to generate API key' },
      { status: 500 }
    )
  }
}