import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// CORS設定
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }
}

// OPTIONS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  })
}

// すべてのアクションを処理する統合エンドポイント
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, id, data } = body
    
    const supabase = createAdminClient()
    
    // アクションに応じて処理を分岐
    switch (action) {
      case 'schedule': {
        // スケジュール設定/解除
        const { scheduled_for, status } = data || {}
        
        if (scheduled_for === null || scheduled_for === '') {
          // スケジュール解除
          const { data: result, error } = await supabase
            .from('scheduled_posts')
            .update({
              scheduled_for: null,
              status: 'draft'
            })
            .eq('id', id)
            .select()
            .single()
          
          if (error) {
            return NextResponse.json(
              { error: 'Failed to unschedule', details: error.message },
              { status: 500, headers: getCorsHeaders() }
            )
          }
          
          return NextResponse.json({
            success: true,
            message: 'Schedule removed',
            data: result
          }, { headers: getCorsHeaders() })
        } else {
          // スケジュール設定
          const { data: result, error } = await supabase
            .from('scheduled_posts')
            .update({
              scheduled_for,
              status: status || 'pending'
            })
            .eq('id', id)
            .select()
            .single()
          
          if (error) {
            return NextResponse.json(
              { error: 'Failed to schedule', details: error.message },
              { status: 500, headers: getCorsHeaders() }
            )
          }
          
          return NextResponse.json({
            success: true,
            data: result
          }, { headers: getCorsHeaders() })
        }
      }
      
      case 'delete': {
        // コンテンツ削除
        const { error } = await supabase
          .from('scheduled_posts')
          .delete()
          .eq('id', id)
        
        if (error) {
          return NextResponse.json(
            { error: 'Failed to delete', details: error.message },
            { status: 500, headers: getCorsHeaders() }
          )
        }
        
        return NextResponse.json({
          success: true,
          message: 'Content deleted',
          deletedId: id
        }, { headers: getCorsHeaders() })
      }
      
      case 'publish': {
        // 即時公開
        const { data: result, error } = await supabase
          .from('scheduled_posts')
          .update({
            status: 'published',
            published_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single()
        
        if (error) {
          return NextResponse.json(
            { error: 'Failed to publish', details: error.message },
            { status: 500, headers: getCorsHeaders() }
          )
        }
        
        return NextResponse.json({
          success: true,
          data: result
        }, { headers: getCorsHeaders() })
      }
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400, headers: getCorsHeaders() }
        )
    }
  } catch (error) {
    console.error('Action error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: getCorsHeaders() }
    )
  }
}