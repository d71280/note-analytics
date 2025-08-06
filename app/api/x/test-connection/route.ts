import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = createClient()
    
    // X API設定を取得
    const { data: config, error } = await supabase
      .from('x_api_configs')
      .select('*')
      .single()
    
    if (error || !config) {
      return NextResponse.json(
        { error: 'X API configuration not found' },
        { status: 404 }
      )
    }
    
    if (!config.access_token) {
      return NextResponse.json(
        { error: 'Access token not found' },
        { status: 400 }
      )
    }
    
    // Twitter API v2でユーザー情報を取得してテスト
    const response = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${config.access_token}`,
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { 
          error: 'X API connection failed',
          details: errorText,
          status: response.status
        },
        { status: 400 }
      )
    }
    
    const userData = await response.json()
    
    return NextResponse.json({
      success: true,
      message: 'X API connection successful',
      user: userData.data
    })
    
  } catch (error) {
    console.error('X API test connection error:', error)
    return NextResponse.json(
      { error: 'Failed to test X API connection' },
      { status: 500 }
    )
  }
}