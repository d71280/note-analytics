import { NextRequest, NextResponse } from 'next/server'

// Rate limiting store (in production, use Redis or database)
const requestCounts = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const limit = 30 // 30 requests per minute
  const windowMs = 60 * 1000 // 1 minute

  const current = requestCounts.get(ip)
  
  if (!current || now > current.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (current.count >= limit) {
    return false
  }
  
  current.count++
  return true
}

export async function GET(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    
    // Rate limiting check
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    // Get the target URL from query parameters
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint')
    
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Missing endpoint parameter' },
        { status: 400 }
      )
    }

    // Construct the Note.com API URL
    const noteApiUrl = `https://note.com${endpoint}`
    
    console.log('🔍 Proxying Note API request:', noteApiUrl)

    // Make request to Note.com API
    const response = await fetch(noteApiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (Note Analytics Platform)',
        'Referer': 'https://note.com/',
        'Origin': 'https://note.com',
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error('Note API Error:', {
        status: response.status,
        statusText: response.statusText,
        url: noteApiUrl,
        error: errorText
      })
      
      return NextResponse.json(
        { 
          error: `Note API Error: ${response.status} ${response.statusText}`,
          details: errorText
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Return the data with CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })

  } catch (error) {
    console.error('Proxy Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
} 