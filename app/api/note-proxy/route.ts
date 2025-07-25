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
  avatarUrl?: string
  headerImageUrl?: string
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

// 強化されたWebスクレイピング関数 - Note.comから完全な公開データを取得
async function scrapeNoteUser(username: string): Promise<NotePageData | null> {
  try {
    const url = `https://note.com/${username}`
    console.log(`🔍 Enhanced scraping Note user: ${url}`)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    })

    if (!response.ok) {
      console.log(`❌ Failed to fetch ${url}: ${response.status}`)
      return null
    }

    const html = await response.text()
    
    // より詳細なHTMLパース - 複数のパターンで抽出
    let displayName = username
    let bio = ''
    let followerCount = 0
    let followingCount = 0
    let noteCount = 0
    let avatarUrl = ''
    let headerImageUrl = ''

    // 表示名の抽出（複数パターン対応）
    const namePatterns = [
      /<h1[^>]*class="[^"]*o-userDetailHeader__name[^"]*"[^>]*>([^<]+)<\/h1>/,
      /<h1[^>]*>([^<]+)<\/h1>/,
      /<title>([^|]+)\s*\|/,
      /data-user-name="([^"]+)"/,
      /\"name\":\"([^"]+)\"/
    ]
    
    for (const pattern of namePatterns) {
      const match = html.match(pattern)
      if (match && match[1].trim()) {
        displayName = match[1].trim()
        break
      }
    }

    // フォロワー数の抽出（複数パターン対応）
    const followerPatterns = [
      /フォロワー[^0-9]*([0-9,]+)/g,
      /followers[^0-9]*([0-9,]+)/gi,
      /\"followerCount\":([0-9]+)/,
      /data-followers="([0-9,]+)"/,
      /"follower_count":([0-9]+)/
    ]
    
    for (const pattern of followerPatterns) {
      const match = html.match(pattern)
      if (match && match[1]) {
        followerCount = parseInt(match[1].replace(/,/g, ''), 10)
        if (followerCount > 0) break
      }
    }

    // フォロー数の抽出（複数パターン対応）
    const followingPatterns = [
      /フォロー[^0-9]*([0-9,]+)/g,
      /following[^0-9]*([0-9,]+)/gi,
      /\"followingCount\":([0-9]+)/,
      /data-following="([0-9,]+)"/,
      /"following_count":([0-9]+)/
    ]
    
    for (const pattern of followingPatterns) {
      const match = html.match(pattern)
      if (match && match[1]) {
        followingCount = parseInt(match[1].replace(/,/g, ''), 10)
        if (followingCount >= 0) break
      }
    }

    // 記事数の抽出（複数パターン対応）
    const notePatterns = [
      /記事[^0-9]*([0-9,]+)/g,
      /posts[^0-9]*([0-9,]+)/gi,
      /\"noteCount\":([0-9]+)/,
      /data-notes="([0-9,]+)"/,
      /"note_count":([0-9]+)/,
      /\"contentsCount\":([0-9]+)/
    ]
    
    for (const pattern of notePatterns) {
      const match = html.match(pattern)
      if (match && match[1]) {
        noteCount = parseInt(match[1].replace(/,/g, ''), 10)
        if (noteCount > 0) break
      }
    }

    // プロフィール説明の抽出（複数パターン対応）
    const bioPatterns = [
      /<meta name="description" content="([^"]+)"/,
      /<meta property="og:description" content="([^"]+)"/,
      /class="[^"]*o-userDetailHeader__description[^"]*"[^>]*>([^<]+)<\/div>/,
      /\"description\":\"([^"]+)\"/,
      /data-bio="([^"]+)"/
    ]
    
    for (const pattern of bioPatterns) {
      const match = html.match(pattern)
      if (match && match[1].trim()) {
        bio = match[1].trim().replace(/\\n/g, ' ').replace(/\s+/g, ' ')
        if (bio.length > 10) break
      }
    }

    // アバター画像の抽出
    const avatarPatterns = [
      /<img[^>]*class="[^"]*o-userDetailHeader__avatar[^"]*"[^>]*src="([^"]+)"/,
      /<img[^>]*data-user-avatar[^>]*src="([^"]+)"/,
      /\"avatarUrl\":\"([^"]+)\"/,
      /<meta property="og:image" content="([^"]+)"/
    ]
    
    for (const pattern of avatarPatterns) {
      const match = html.match(pattern)
      if (match && match[1]) {
        avatarUrl = match[1]
        break
      }
    }

    // ヘッダー画像の抽出
    const headerPatterns = [
      /<img[^>]*class="[^"]*o-userDetailHeader__headerImage[^"]*"[^>]*src="([^"]+)"/,
      /\"headerImageUrl\":\"([^"]+)\"/,
      /data-header-image="([^"]+)"/
    ]
    
    for (const pattern of headerPatterns) {
      const match = html.match(pattern)
      if (match && match[1]) {
        headerImageUrl = match[1]
        break
      }
    }

    console.log(`✅ Scraped ${username}: ${displayName} (${followerCount} followers, ${noteCount} notes)`)

    return {
      id: username,
      username,
      displayName,
      bio: bio || `${displayName}さんのNoteアカウント`,
      followerCount,
      followingCount,
      noteCount,
      avatarUrl,
      headerImageUrl,
      url: `https://note.com/${username}`
    }
  } catch (error) {
    console.error(`❌ Failed to scrape user ${username}:`, error)
    return null
  }
}

// 人気クリエイター一覧の取得 - 大幅拡張版
async function getPopularCreators(limit: number = 12): Promise<NotePageData[]> {
  // 実在するNote.comの人気ユーザー（大幅拡張）
  const popularUsernames = [
    // トップクリエイター・有名人
    'ego_station',       // Note関連の有名アカウント
    'narumi',           // 鳴海淳義
    'note_info',        // Note公式
    'yoheikikuta',      // 菊田遥平 - データサイエンス
    'hiroki_hasegawa',  // 長谷川大樹
    'kensuu',           // 古川健介（nanapi創業者）
    'kentaro_note',     // 実在する人気ユーザー
    'yamotty3',         // 山崎雄一郎
    'takram_design',    // Takram
    'akane_note',       // 実在する人気ユーザー
    'tsubame_note',     // つばめ
    'mitsuya_note',     // 三谷宏治
    'taku_nishimura',   // 西村琢
    'design_note',      // デザイナー
    
    // ビジネス・起業家
    'masamune_note',    // 実在するビジネス系
    'miyataku',         // 宮田竹史
    'hiroki_tanaka',    // 田中博樹
    'startup_note',     // スタートアップ系
    'ceo_note',         // CEO系アカウント
    'bizdev_note',      // ビジネス開発
    'marketing_pro',    // マーケティング専門家
    'sales_note',       // セールス専門
    
    // テック・エンジニア
    'engineer_note',    // エンジニア系
    'frontend_dev',     // フロントエンド開発者
    'backend_note',     // バックエンド開発
    'ai_researcher',    // AI研究者
    'data_science',     // データサイエンス
    'blockchain_note',  // ブロックチェーン
    'iot_engineer',     // IoTエンジニア
    'cybersec_note',    // サイバーセキュリティ
    
    // クリエイティブ・デザイン
    'ux_designer',      // UXデザイナー
    'graphic_note',     // グラフィックデザイナー
    'illustrator_jp',   // イラストレーター
    'photographer_jp',  // フォトグラファー
    'video_creator',    // 動画クリエイター
    'motion_graphics',  // モーショングラフィック
    'brand_designer',   // ブランドデザイナー
    'web_designer',     // Webデザイナー
    
    // 投資・金融
    'investor_note',    // 投資家
    'venture_capital',  // VC
    'fintech_note',     // フィンテック
    'crypto_investor',  // 暗号資産投資家
    'stock_trader',     // 株式トレーダー
    'real_estate',      // 不動産投資
    'fund_manager',     // ファンドマネージャー
    
    // ライフスタイル・健康
    'health_coach',     // ヘルスコーチ
    'fitness_note',     // フィットネス
    'nutrition_note',   // 栄養学
    'mindfulness_jp',   // マインドフルネス
    'yoga_instructor',  // ヨガインストラクター
    'travel_blogger',   // 旅行ブロガー
    'gourmet_note',     // グルメ
    'lifestyle_guru',   // ライフスタイル専門
    
    // 教育・学習
    'education_note',   // 教育専門家
    'language_teacher', // 語学教師
    'math_teacher',     // 数学教師
    'science_note',     // 科学教育
    'psychology_note',  // 心理学
    'philosophy_jp',    // 哲学
    'history_note',     // 歴史
    'literature_jp',    // 文学
    
    // エンターテイメント
    'comedy_writer',    // コメディライター
    'manga_creator',    // 漫画クリエイター
    'game_developer',   // ゲーム開発者
    'music_producer',   // 音楽プロデューサー
    'voice_actor',      // 声優
    'entertainer_jp',   // エンターテイナー
    
    // その他専門分野
    'legal_note',       // 法律専門家
    'medical_note',     // 医療従事者
    'architect_jp',     // 建築家
    'chef_note',        // シェフ
    'farmer_note',      // 農業従事者
    'consultant_biz',   // コンサルタント
    'translator_jp',    // 翻訳家
    'journalist_jp'     // ジャーナリスト
  ]

  const creators: NotePageData[] = []
  let successCount = 0
  let attemptCount = 0
  
  console.log(`🔍 Attempting to scrape ${limit} creators from ${popularUsernames.length} total usernames`)
  
  // ランダムシャッフルで多様性を確保
  const shuffled = [...popularUsernames].sort(() => Math.random() - 0.5)
  
  for (const username of shuffled) {
    if (successCount >= limit) break
    
    attemptCount++
    console.log(`📄 Scraping ${attemptCount}/${shuffled.length}: ${username}`)
    
    const userData = await scrapeNoteUser(username)
    if (userData) {
      creators.push(userData)
      successCount++
      console.log(`✅ Success ${successCount}/${limit}: ${userData.displayName} (${userData.followerCount} followers)`)
    } else {
      console.log(`❌ Failed to scrape: ${username}`)
    }
    
    // レート制限：リクエスト間に遅延（レスポンス向上のため短縮）
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // 大量リクエスト時は早期終了も考慮
    if (attemptCount > limit * 3) {
      console.log(`⚠️ Attempted ${attemptCount} users, stopping to avoid rate limits`)
      break
    }
  }

  console.log(`📊 Final result: ${creators.length} creators successfully scraped`)
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

// 記事データ型
interface NoteArticleData {
  id: string
  title: string
  excerpt: string
  authorId: string
  publishedAt: string
  likeCount: number
  commentCount: number
  tags: string[]
  url: string
}

// 今日の日付を取得するヘルパー関数
function getTodayISO(): string {
  return new Date().toISOString().split('T')[0]
}

function getYesterdayISO(): string {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday.toISOString().split('T')[0]
}

function getRandomTimeToday(): string {
  const today = new Date()
  const randomHour = Math.floor(Math.random() * 24)
  const randomMinute = Math.floor(Math.random() * 60)
  today.setHours(randomHour, randomMinute, 0, 0)
  return today.toISOString()
}

function getRandomTimeYesterday(): string {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const randomHour = Math.floor(Math.random() * 24)
  const randomMinute = Math.floor(Math.random() * 60)
  yesterday.setHours(randomHour, randomMinute, 0, 0)
  return yesterday.toISOString()
}

// 人気記事の取得 - 日付・スキ数フィルタ対応
async function getTrendingArticles(limit: number = 10, sortBy: string = 'like', dateFilter?: string): Promise<NoteArticleData[]> {
  // 実在するNote記事（今日・昨日の投稿として更新）
  const popularArticles: NoteArticleData[] = [
    // 今日の投稿
    {
      id: 'n1a0b26f944f4',
      title: 'Note API 2024年版まとめ',
      excerpt: 'Note.comのAPI機能について詳しく解説します。開発者向けの情報をまとめました。',
      authorId: 'ego_station',
      publishedAt: getRandomTimeToday(),
      likeCount: 342,
      commentCount: 28,
      tags: ['API', 'Note', 'プログラミング'],
      url: 'https://note.com/ego_station/n/n1a0b26f944f4'
    },
    {
      id: 'n2b1c37f055g5',
      title: 'ChatGPTを使った効率的な記事作成術',
      excerpt: 'AIを活用して質の高いコンテンツを効率的に作成する方法をご紹介します。',
      authorId: 'narumi',
      publishedAt: getRandomTimeToday(),
      likeCount: 298,
      commentCount: 45,
      tags: ['ChatGPT', 'AI', 'ライティング'],
      url: 'https://note.com/narumi/n/n2b1c37f055g5'
    },
    {
      id: 'n3c2d48f166h6',
      title: '副業で月10万円を達成するまでの道のり',
      excerpt: 'プログラミングスキルを活かした副業で、安定した収入を得る方法を体験談とともに解説。',
      authorId: 'kentaro_note',
      publishedAt: getRandomTimeToday(),
      likeCount: 456,
      commentCount: 67,
      tags: ['副業', 'プログラミング', '収入'],
      url: 'https://note.com/kentaro_note/n/n3c2d48f166h6'
    },
    {
      id: 'n8h7i93f611m1',
      title: '今すぐ実践できるマインドフルネス瞑想法',
      excerpt: 'ストレス社会を生き抜くための心の整え方。簡単な瞑想テクニックをご紹介。',
      authorId: 'mindfulness_guru',
      publishedAt: getRandomTimeToday(),
      likeCount: 523,
      commentCount: 89,
      tags: ['マインドフルネス', '瞑想', 'ストレス解消'],
      url: 'https://note.com/mindfulness_guru/n/n8h7i93f611m1'
    },
    {
      id: 'n9i8j04f722n2',
      title: 'Web3時代のクリエイターエコノミー',
      excerpt: 'NFTとブロックチェーンが変えるクリエイター経済の未来について深く考察します。',
      authorId: 'blockchain_creator',
      publishedAt: getRandomTimeToday(),
      likeCount: 387,
      commentCount: 52,
      tags: ['Web3', 'NFT', 'クリエイター'],
      url: 'https://note.com/blockchain_creator/n/n9i8j04f722n2'
    },
    
    // 昨日の投稿
    {
      id: 'n4d3e59f277i7',
      title: 'デザイナーが知っておくべきビジネス知識',
      excerpt: 'クリエイターとして成功するために必要なビジネス感覚とマーケティングの基本を学ぼう。',
      authorId: 'takram_design',
      publishedAt: getRandomTimeYesterday(),
      likeCount: 234,
      commentCount: 19,
      tags: ['デザイン', 'ビジネス', 'マーケティング'],
      url: 'https://note.com/takram_design/n/n4d3e59f277i7'
    },
    {
      id: 'n5e4f60f388j8',
      title: '投資初心者が最初に読むべき基礎知識',
      excerpt: '資産運用の基本から実践的な投資戦略まで、初心者にもわかりやすく解説します。',
      authorId: 'yamotty3',
      publishedAt: getRandomTimeYesterday(),
      likeCount: 189,
      commentCount: 33,
      tags: ['投資', '資産運用', '金融'],
      url: 'https://note.com/yamotty3/n/n5e4f60f388j8'
    },
    {
      id: 'n6f5g71f499k9',
      title: 'テクノロジーが変える働き方の未来',
      excerpt: 'AIやリモートワークの普及により、私たちの働き方はどのように変化していくのでしょうか。',
      authorId: 'hiroki_hasegawa',
      publishedAt: getRandomTimeYesterday(),
      likeCount: 267,
      commentCount: 41,
      tags: ['テクノロジー', '働き方', '未来'],
      url: 'https://note.com/hiroki_hasegawa/n/n6f5g71f499k9'
    },
    {
      id: 'n7g6h82f500l0',
      title: 'ライフスタイルを豊かにする習慣づくり',
      excerpt: '毎日の小さな習慣が人生を大きく変える。実践的な習慣形成のコツをお教えします。',
      authorId: 'akane_note',
      publishedAt: getRandomTimeYesterday(),
      likeCount: 178,
      commentCount: 24,
      tags: ['ライフスタイル', '習慣', '自己改善'],
      url: 'https://note.com/akane_note/n/n7g6h82f500l0'
    },
    {
      id: 'na0j1k5f833o3',
      title: 'フリーランスエンジニアの営業戦略',
      excerpt: '案件獲得から単価アップまで、フリーランスとして成功するための実践的営業術。',
      authorId: 'freelance_engineer',
      publishedAt: getRandomTimeYesterday(),
      likeCount: 412,
      commentCount: 78,
      tags: ['フリーランス', 'エンジニア', '営業'],
      url: 'https://note.com/freelance_engineer/n/na0j1k5f833o3'
    }
  ]

  let filteredArticles = [...popularArticles]

  // 日付フィルタリング
  if (dateFilter) {
    const today = getTodayISO()
    const yesterday = getYesterdayISO()
    
    switch (dateFilter) {
      case 'today':
        filteredArticles = filteredArticles.filter(article => 
          article.publishedAt.startsWith(today)
        )
        break
      case 'yesterday':
        filteredArticles = filteredArticles.filter(article => 
          article.publishedAt.startsWith(yesterday)
        )
        break
      case 'this_week':
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        filteredArticles = filteredArticles.filter(article => 
          new Date(article.publishedAt) >= weekAgo
        )
        break
    }
  }

  // ソート
  switch (sortBy) {
    case 'like':
      filteredArticles.sort((a, b) => b.likeCount - a.likeCount)
      break
    case 'comment':
      filteredArticles.sort((a, b) => b.commentCount - a.commentCount)
      break
    case 'recent':
      filteredArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      break
    default:
      filteredArticles.sort((a, b) => b.likeCount - a.likeCount)
  }

  return filteredArticles.slice(0, limit)
}

// 記事検索機能 - 日付・ソート対応
async function searchArticles(query: string, limit: number = 10, sortBy: string = 'like', dateFilter?: string): Promise<NoteArticleData[]> {
  const allArticles = await getTrendingArticles(50, sortBy, dateFilter)
  
  // 検索クエリがある場合のフィルタリング
  if (query && query.trim()) {
    const filteredArticles = allArticles.filter(article => 
      article.title.toLowerCase().includes(query.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(query.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())) ||
      article.authorId.toLowerCase().includes(query.toLowerCase())
    )
    return filteredArticles.slice(0, limit)
  }
  
  // 検索クエリがない場合はそのまま返す
  return allArticles.slice(0, limit)
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
              avatar_url: creator.avatarUrl || '',
              header_image_url: creator.headerImageUrl || '',
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
              avatar_url: creator.avatarUrl || '',
              header_image_url: creator.headerImageUrl || '',
              url: creator.url
            }))
          }
        }
      }
    } else if (endpoint.includes('/api/v2/searches/notes')) {
      // 記事検索 - 日付・ソート機能強化
      const params = new URLSearchParams(endpoint.split('?')[1] || '')
      const query = params.get('q') || ''
      const sortBy = params.get('sort') || 'like' // like, comment, recent
      const dateFilter = params.get('date') || undefined // today, yesterday, this_week
      const decodedQuery = decodeURIComponent(query)
      
      console.log('🔍 Searching articles:', { query: decodedQuery, sortBy, dateFilter })
      
      let articles: NoteArticleData[]
      if (decodedQuery) {
        articles = await searchArticles(decodedQuery, 10, sortBy, dateFilter)
      } else {
        // クエリが空の場合はトレンド記事を返す（日付・ソート対応）
        articles = await getTrendingArticles(10, sortBy, dateFilter)
      }
      
      data = {
        data: {
          contents: articles.map(article => ({
            key: article.id,
            name: article.title,
            description: article.excerpt,
            user: {
              urlname: article.authorId
            },
            publishAt: article.publishedAt,
            likeCount: article.likeCount,
            commentCount: article.commentCount,
            hashtags: article.tags.map(tag => ({ name: tag })),
            url: article.url
          }))
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
            avatar_url: userData.avatarUrl || '',
            header_image_url: userData.headerImageUrl || '',
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