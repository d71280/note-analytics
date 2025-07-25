import { NextRequest, NextResponse } from 'next/server'

// スクレイピング機能をインライン実装（外部ファイルの依存関係を避けるため）
interface NotePageData {
  id: string
  username: string
  displayName: string
  bio?: string
  followerCount: number
  followingCount: number
  noteCount: number
  url: string
}



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

// Webスクレイピング関数
async function scrapeNoteUser(username: string): Promise<NotePageData | null> {
  try {
    const url = `https://note.com/${username}`
    console.log(`🔍 Scraping Note user: ${url}`)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Note Analytics Platform)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
      },
    })

    if (!response.ok) {
      return null
    }

    const html = await response.text()
    
    // HTMLから情報を抽出
    let displayName = username
    let bio = ''
    let followerCount = 0
    let followingCount = 0
    let noteCount = 0

    // displayNameの抽出
    const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/)
    if (nameMatch) {
      displayName = nameMatch[1].trim()
    }

    // フォロワー数の抽出
    const followerMatch = html.match(/フォロワー[^0-9]*([0-9,]+)/)
    if (followerMatch) {
      followerCount = parseInt(followerMatch[1].replace(/,/g, ''), 10)
    }

    // フォロー数の抽出
    const followingMatch = html.match(/フォロー[^0-9]*([0-9,]+)/)
    if (followingMatch) {
      followingCount = parseInt(followingMatch[1].replace(/,/g, ''), 10)
    }

    // 記事数の抽出
    const noteMatch = html.match(/記事[^0-9]*([0-9,]+)/)
    if (noteMatch) {
      noteCount = parseInt(noteMatch[1].replace(/,/g, ''), 10)
    }

    // プロフィール説明の抽出
    const bioMatch = html.match(/<meta name="description" content="([^"]+)"/)
    if (bioMatch) {
      bio = bioMatch[1].trim()
    }

    return {
      id: username,
      username,
      displayName,
      bio,
      followerCount,
      followingCount,
      noteCount,
      url: `https://note.com/${username}`
    }
  } catch (error) {
    console.error(`Failed to scrape user ${username}:`, error)
    return null
  }
}

// 人気クリエイター一覧の取得
async function getPopularCreators(limit: number = 12): Promise<NotePageData[]> {
  // 実在するNote.comの人気ユーザー
  const popularUsernames = [
    'ego_station',       // Note関連の有名アカウント
    'narumi',           // Noteの代表的ユーザー  
    'note_info',        // Note公式
    'hiroki_hasegawa',  // 実在する人気ユーザー
    'kentaro_note',     // 実在する人気ユーザー
    'yamotty3',         // 実在する人気ユーザー
    'takram_design',    // デザイン系
    'akane_note',       // 実在する人気ユーザー
    'mitsuya_note',     // 実在する人気ユーザー
    'yoheikikuta',      // データサイエンス系
    'taku_nishimura',   // ビジネス系
    'design_note'       // デザイン系
  ]

  const creators: NotePageData[] = []
  
  for (const username of popularUsernames.slice(0, limit)) {
    const userData = await scrapeNoteUser(username)
    if (userData) {
      creators.push(userData)
    }
    
    // レート制限：リクエスト間に遅延
    await new Promise(resolve => setTimeout(resolve, 300))
  }

  return creators
}

// 検索機能のシミュレーション
async function searchCreators(query: string, limit: number = 10): Promise<NotePageData[]> {
  // 人気クリエイターの中からキーワードに関連するものを検索
  const allCreators = await getPopularCreators(20)
  
  const filteredCreators = allCreators.filter(creator => 
    creator.displayName.toLowerCase().includes(query.toLowerCase()) ||
    creator.bio?.toLowerCase().includes(query.toLowerCase()) ||
    creator.username.toLowerCase().includes(query.toLowerCase())
  )

  return filteredCreators.slice(0, limit)
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

    console.log('🔍 Note scraping request:', endpoint)

    let data: unknown = null

    // Route based on endpoint
    if (endpoint.includes('/api/v2/searches/creators')) {
      // クリエイター検索
      const params = new URLSearchParams(endpoint.split('?')[1] || '')
      const query = params.get('q') || ''
      const decodedQuery = decodeURIComponent(query)
      
      console.log('🔍 Searching creators for:', decodedQuery)
      
      if (decodedQuery) {
        const creators = await searchCreators(decodedQuery, 10)
        data = {
          data: {
            contents: creators.map(creator => ({
              id: creator.id,
              username: creator.username,
              display_name: creator.displayName,
              bio: creator.bio || '',
              follower_count: creator.followerCount,
              following_count: creator.followingCount,
              note_count: creator.noteCount,
              url: creator.url
            }))
          }
        }
      } else {
        // クエリが空の場合は人気クリエイターを返す
        const creators = await getPopularCreators(10)
        data = {
          data: {
            contents: creators.map(creator => ({
              id: creator.id,
              username: creator.username,
              display_name: creator.displayName,
              bio: creator.bio || '',
              follower_count: creator.followerCount,
              following_count: creator.followingCount,
              note_count: creator.noteCount,
              url: creator.url
            }))
          }
        }
      }
    } else if (endpoint.includes('/api/v2/creators/')) {
      // 個別ユーザー取得
      const username = endpoint.split('/creators/')[1].split('?')[0]
      console.log('🔍 Getting user:', username)
      
      const userData = await scrapeNoteUser(username)
      if (userData) {
        data = {
          data: {
            id: userData.id,
            username: userData.username,
            display_name: userData.displayName,
            bio: userData.bio || '',
            follower_count: userData.followerCount,
            following_count: userData.followingCount,
            note_count: userData.noteCount,
            url: userData.url
          }
        }
      } else {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
    } else {
      // 未対応のエンドポイント
      return NextResponse.json(
        { error: 'Endpoint not supported yet. We are implementing real Note.com scraping.' },
        { status: 501 }
      )
    }
    
    // Return the data with CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })

  } catch (error) {
    console.error('Scraping Error:', error)
    
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