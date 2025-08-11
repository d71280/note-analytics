import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Vercel Cronからのリクエストか確認
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const supabase = createClient()
    
    // 現在時刻より前のスケジュールされた投稿を取得
    const now = new Date().toISOString()
    const { data: pendingPosts, error: fetchError } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true })
      .limit(10)
    
    if (fetchError) {
      console.error('Failed to fetch pending posts:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch pending posts' },
        { status: 500 }
      )
    }
    
    if (!pendingPosts || pendingPosts.length === 0) {
      return NextResponse.json({ message: 'No pending posts' })
    }
    
    const results = []
    
    // 各投稿を処理
    for (const post of pendingPosts) {
      try {
        console.log(`Processing ${post.platform} post: ${post.id}`)
        
        // プラットフォームに応じたAPIエンドポイントを呼び出す
        let apiEndpoint = ''
        let requestBody = {}
        
        switch (post.platform) {
          case 'x':
            apiEndpoint = '/api/x/post'
            requestBody = { text: post.content }
            break
          case 'note':
            apiEndpoint = '/api/note/post'
            requestBody = {
              content: post.content,
              title: post.metadata?.title || 'Note投稿',
              platform: 'note'
            }
            break
          case 'wordpress':
            apiEndpoint = '/api/wordpress/post'
            requestBody = {
              content: post.content,
              title: post.metadata?.title || 'WordPress投稿',
              platform: 'wordpress'
            }
            break
          default:
            console.error(`Unknown platform: ${post.platform}`)
            continue
        }
        
        // APIを呼び出し
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get('host')}`
        const response = await fetch(`${baseUrl}${apiEndpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        })
          
          if (response.ok) {
            const data = await response.json()
            
            // ステータスを更新
            await supabase
              .from('scheduled_posts')
              .update({ 
                status: 'posted',
                posted_at: new Date().toISOString(),
                metadata: {
                  ...post.metadata,
                  response: data
                }
              })
              .eq('id', post.id)
            
            results.push({
              id: post.id,
              status: 'posted',
              platform: post.platform
            })
          } else {
            const errorData = await response.text()
            throw new Error(`X API error: ${errorData}`)
          }
        
      } catch (postError) {
        console.error(`Failed to post ${post.id}:`, postError)
        
        // エラーステータスに更新
        await supabase
          .from('scheduled_posts')
          .update({ 
            status: 'failed',
            error_message: postError instanceof Error ? postError.message : 'Unknown error'
          })
          .eq('id', post.id)
        
        results.push({
          id: post.id,
          status: 'failed',
          error: postError instanceof Error ? postError.message : 'Unknown error'
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      processed: results.length,
      results
    })
    
  } catch (error) {
    console.error('Cron process error:', error)
    return NextResponse.json(
      { error: 'Failed to process posts' },
      { status: 500 }
    )
  }
}