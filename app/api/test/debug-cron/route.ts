import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// cronジョブの環境変数とURLを確認
export async function GET() {
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_APP_URL || 'https://note-analytics.vercel.app'
  
  const env = {
    VERCEL_URL: process.env.VERCEL_URL || 'not set',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'not set',
    NODE_ENV: process.env.NODE_ENV || 'not set',
    CRON_SECRET: process.env.CRON_SECRET ? 'set (hidden)' : 'not set',
    X_BEARER_TOKEN: process.env.X_BEARER_TOKEN ? 'set (hidden)' : 'not set',
    X_API_KEY: process.env.X_API_KEY ? 'set (hidden)' : 'not set',
    computedBaseUrl: baseUrl
  }
  
  // X API設定の確認
  let xApiStatus = 'unknown'
  try {
    const hasXConfig = !!(
      process.env.X_BEARER_TOKEN && 
      (process.env.X_API_KEY || process.env.X_API_KEY_SECRET)
    )
    xApiStatus = hasXConfig ? 'configured' : 'missing credentials'
  } catch (error) {
    xApiStatus = 'error checking config'
  }
  
  // 最新の失敗した投稿を取得
  const supabase = createClient()
  const { data: failedPosts } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('status', 'failed')
    .order('updated_at', { ascending: false })
    .limit(3)
  
  return NextResponse.json({
    environment: env,
    xApiStatus,
    failedPosts: failedPosts?.map(p => ({
      id: p.id,
      platform: p.platform,
      scheduled_for: p.scheduled_for,
      error: p.metadata?.error || 'no error message',
      retry_count: p.metadata?.retry_count || 0,
      content_preview: p.content.substring(0, 30) + '...'
    })),
    testUrls: {
      xPost: `${baseUrl}/api/x/post`,
      notePost: `${baseUrl}/api/note/post`,
      cronAutoPost: `${baseUrl}/api/cron/auto-post`
    }
  })
}

// X APIへの直接投稿テスト
export async function POST() {
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL || 'https://note-analytics.vercel.app'
    
    const testContent = 'テスト投稿 from debug-cron: ' + new Date().toISOString()
    
    console.log('Attempting to post to:', `${baseUrl}/api/x/post`)
    
    const response = await fetch(`${baseUrl}/api/x/post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: testContent,
        postType: 'test'
      })
    })
    
    const result = await response.json()
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      result,
      testUrl: `${baseUrl}/api/x/post`,
      content: testContent
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.name : 'Unknown'
    }, { status: 500 })
  }
}