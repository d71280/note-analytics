import { NextRequest, NextResponse } from 'next/server'

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  })
}

export async function POST(request: NextRequest) {
  console.log('=== Chrome Extension Content Receive API ===')
  console.log('Headers:', Object.fromEntries(request.headers.entries()))
  
  try {
    const contentType = request.headers.get('content-type')
    console.log('Content-Type:', contentType)
    
    let body
    if (contentType?.includes('application/json')) {
      body = await request.json()
    } else {
      const text = await request.text()
      console.log('Raw text body:', text)
      try {
        body = JSON.parse(text)
      } catch {
        body = { content: text }
      }
    }
    
    console.log('Parsed body:', body)
    
    const { content, url, title } = body
    
    if (!content) {
      return NextResponse.json(
        { 
          error: 'Content is required',
          receivedBody: body
        },
        { 
          status: 400,
          headers: getCorsHeaders()
        }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Content received successfully',
      contentLength: content.length,
      url: url || 'not provided',
      title: title || 'not provided',
      timestamp: new Date().toISOString()
    }, {
      headers: getCorsHeaders()
    })
    
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: getCorsHeaders()
      }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Extension receive endpoint is working',
    timestamp: new Date().toISOString()
  }, {
    headers: getCorsHeaders()
  })
}