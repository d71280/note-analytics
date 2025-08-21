import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// テスト用：認証なしでスケジュール投稿を処理
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 スケジュール投稿の処理を開始...')
    
    const supabase = createAdminClient()
    
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
        { error: 'Failed to fetch pending posts', details: fetchError },
        { status: 500 }
      )
    }
    
    if (!pendingPosts || pendingPosts.length === 0) {
      return NextResponse.json({ 
        message: 'No pending posts to process',
        checked_at: now 
      })
    }
    
    console.log(`📋 ${pendingPosts.length}件の投稿を処理します`)
    
    const results = []
    
    // 各投稿を処理
    for (const post of pendingPosts) {
      try {
        console.log(`\n📝 処理中: ${post.id}`)
        console.log(`   プラットフォーム: ${post.platform}`)
        console.log(`   内容: ${post.content.substring(0, 50)}...`)
        
        // プラットフォームに応じたAPIエンドポイントを呼び出す
        let apiEndpoint = ''
        let requestBody = {}
        
        switch (post.platform) {
          case 'x':
            apiEndpoint = '/api/x/post'
            // 手動投稿と同じ形式で送信
            requestBody = { 
              text: post.content,
              content: post.content,
              postType: 'scheduled' 
            }
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
            results.push({
              id: post.id,
              status: 'skipped',
              reason: `Unknown platform: ${post.platform}`
            })
            continue
        }
        
        // APIを呼び出し（ローカル環境を優先）
        const baseUrl = `http://localhost:3000`
        console.log(`   API呼び出し: ${baseUrl}${apiEndpoint}`)
        
        const response = await fetch(`${baseUrl}${apiEndpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        })
        
        const responseData = await response.json()
        
        if (response.ok) {
          console.log(`   ✅ 投稿成功`)
          
          // ステータスを更新
          const { error: updateError } = await supabase
            .from('scheduled_posts')
            .update({ 
              status: 'posted',
              posted_at: new Date().toISOString(),
              metadata: {
                ...post.metadata,
                response: responseData
              }
            })
            .eq('id', post.id)
          
          if (updateError) {
            console.error('   ⚠️ ステータス更新エラー:', updateError)
          }
          
          results.push({
            id: post.id,
            status: 'posted',
            platform: post.platform,
            response: responseData
          })
        } else {
          console.error(`   ❌ 投稿失敗:`, responseData)
          
          // エラーステータスに更新
          await supabase
            .from('scheduled_posts')
            .update({ 
              status: 'failed',
              error_message: responseData.error || 'Unknown error',
              metadata: {
                ...post.metadata,
                error_response: responseData
              }
            })
            .eq('id', post.id)
          
          results.push({
            id: post.id,
            status: 'failed',
            platform: post.platform,
            error: responseData
          })
        }
        
      } catch (postError) {
        console.error(`❌ 投稿処理エラー ${post.id}:`, postError)
        
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
    
    console.log('\n📊 処理結果サマリー:')
    const posted = results.filter(r => r.status === 'posted').length
    const failed = results.filter(r => r.status === 'failed').length
    const skipped = results.filter(r => r.status === 'skipped').length
    console.log(`   成功: ${posted}件`)
    console.log(`   失敗: ${failed}件`)
    console.log(`   スキップ: ${skipped}件`)
    
    return NextResponse.json({
      success: true,
      processed: results.length,
      summary: {
        posted,
        failed,
        skipped
      },
      results
    })
    
  } catch (error) {
    console.error('Process error:', error)
    return NextResponse.json(
      { error: 'Failed to process posts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}