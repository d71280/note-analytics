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

// すべてのメソッドに対応
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  })
}

export async function GET(
  request: NextRequest,
  context: { params: { path: string[] } }
) {
  const path = context.params.path
  return handleRequest('GET', request, path)
}

export async function POST(
  request: NextRequest,
  context: { params: { path: string[] } }
) {
  const path = context.params.path
  return handleRequest('POST', request, path)
}

export async function PUT(
  request: NextRequest,
  context: { params: { path: string[] } }
) {
  const path = context.params.path
  return handleRequest('PUT', request, path)
}

export async function DELETE(
  request: NextRequest,
  context: { params: { path: string[] } }
) {
  const path = context.params.path
  return handleRequest('DELETE', request, path)
}

async function handleRequest(
  method: string,
  request: NextRequest,
  path: string[]
) {
  const supabase = createAdminClient()
  
  // /api/gpts/contents/[id]/schedule
  if (path[0] === 'contents' && path[2] === 'schedule' && method === 'PUT') {
    const id = path[1]
    const body = await request.json()
    const { scheduled_for, status } = body
    
    // スケジュール解除
    if (scheduled_for === null || scheduled_for === '') {
      const { data, error } = await supabase
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
          { error: 'Failed to unschedule content', details: error.message },
          { status: 500, headers: getCorsHeaders() }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'Schedule removed',
        data
      }, {
        headers: getCorsHeaders()
      })
    }
    
    // スケジュール設定
    const { data, error } = await supabase
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
        { error: 'Failed to schedule content', details: error.message },
        { status: 500, headers: getCorsHeaders() }
      )
    }
    
    return NextResponse.json({
      success: true,
      data
    }, {
      headers: getCorsHeaders()
    })
  }
  
  // /api/gpts/contents/[id] - DELETE
  if (path[0] === 'contents' && path.length === 2 && method === 'DELETE') {
    const id = path[1]
    
    const { error } = await supabase
      .from('scheduled_posts')
      .delete()
      .eq('id', id)
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete content', details: error.message },
        { status: 500, headers: getCorsHeaders() }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Content deleted successfully',
      deletedId: id
    }, {
      headers: getCorsHeaders()
    })
  }
  
  // /api/gpts/contents/[id]/publish
  if (path[0] === 'contents' && path[2] === 'publish' && method === 'POST') {
    const id = path[1]
    
    const { data, error } = await supabase
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
        { error: 'Failed to publish content', details: error.message },
        { status: 500, headers: getCorsHeaders() }
      )
    }
    
    return NextResponse.json({
      success: true,
      data
    }, {
      headers: getCorsHeaders()
    })
  }
  
  return NextResponse.json(
    { error: 'Not found' },
    { status: 404, headers: getCorsHeaders() }
  )
}