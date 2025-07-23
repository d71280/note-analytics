// Note API クライアント（2024年版非公式API一覧表に基づく）
// 参考: https://note.com/ego_station/n/n1a0b26f944f4

interface NoteAPIConfig {
  baseURL: string
  timeout: number
  retryAttempts: number
  rateLimit: {
    requests: number
    window: number // ミリ秒
  }
}

interface SearchParams {
  context: 'note' | 'user' | 'magazine'
  q: string
  size?: number
  start?: number
}

interface NoteData {
  id: string
  title: string
  content?: string
  excerpt?: string
  authorId: string
  publishedAt: string
  likeCount: number
  commentCount: number
  tags: string[]
  url: string
}

interface UserData {
  id: string
  username: string
  displayName: string
  bio?: string
  avatarUrl?: string
  followerCount: number
  followingCount: number
  noteCount: number
  url: string
}

interface CategoryData {
  id: string
  name: string
  slug: string
  description?: string
}

interface HashtagData {
  name: string
  count: number
  trending: boolean
}

interface APIResponse<T> {
  data: T
  meta?: {
    totalCount?: number
    hasNext?: boolean
    nextCursor?: string
  }
  error?: string
}

class RateLimiter {
  private requests: Array<number> = []
  private maxRequests: number
  private windowMs: number

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  async checkLimit(): Promise<void> {
    const now = Date.now()
    
    // 古いリクエストを削除
    this.requests = this.requests.filter(time => now - time < this.windowMs)
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests)
      const waitTime = this.windowMs - (now - oldestRequest)
      
      if (waitTime > 0) {
        console.log(`Rate limit reached. Waiting ${waitTime}ms...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
    
    this.requests.push(now)
  }
}

export class NoteAPIClient {
  private config: NoteAPIConfig
  private rateLimiter: RateLimiter

  constructor(config: Partial<NoteAPIConfig> = {}) {
    this.config = {
      baseURL: 'https://note.com/api',
      timeout: 10000,
      retryAttempts: 3,
      rateLimit: {
        requests: 60, // 1分間に60リクエスト（保守的な設定）
        window: 60000
      },
      ...config
    }
    
    this.rateLimiter = new RateLimiter(
      this.config.rateLimit.requests,
      this.config.rateLimit.window
    )
  }

  private async makeRequest<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    await this.rateLimiter.checkLimit()

    const url = `${this.config.baseURL}${path}`
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Note Analytics Platform',
          ...options.headers,
        },
        signal: AbortSignal.timeout(this.config.timeout)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      console.error('API Request failed:', error)
      return { 
        data: null as T, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // 🔍 検索関連API
  async searchArticles(params: SearchParams): Promise<APIResponse<NoteData[]>> {
    const searchParams = new URLSearchParams({
      context: 'note',
      q: params.q,
      size: (params.size || 20).toString(),
      start: (params.start || 0).toString()
    })
    
    return this.makeRequest<NoteData[]>(`/v3/searches?${searchParams}`)
  }

  async searchUsers(params: SearchParams): Promise<APIResponse<UserData[]>> {
    const searchParams = new URLSearchParams({
      context: 'user',
      q: params.q,
      size: (params.size || 20).toString(),
      start: (params.start || 0).toString()
    })
    
    return this.makeRequest<UserData[]>(`/v3/searches?${searchParams}`)
  }

  async searchMagazines(params: SearchParams): Promise<APIResponse<Array<{
    id: string
    title: string
    description?: string
    url: string
  }>>> {
    const searchParams = new URLSearchParams({
      context: 'magazine',
      q: params.q,
      size: (params.size || 20).toString(),
      start: (params.start || 0).toString()
    })
    
    return this.makeRequest<Array<{
      id: string
      title: string
      description?: string
      url: string
    }>>(`/v3/searches?${searchParams}`)
  }

  // 📝 記事関連API
  async getArticleDetail(noteId: string): Promise<APIResponse<NoteData>> {
    return this.makeRequest<NoteData>(`/v3/notes/${noteId}`)
  }

  async getArticleLikes(noteId: string): Promise<APIResponse<Array<{
    userId: string
    username: string
    displayName: string
  }>>> {
    return this.makeRequest<Array<{
      userId: string
      username: string
      displayName: string
    }>>(`/v3/notes/${noteId}/likes`)
  }

  async getArticleComments(noteId: string): Promise<APIResponse<Array<{
    id: string
    content: string
    userId: string
    username: string
    createdAt: string
  }>>> {
    return this.makeRequest<Array<{
      id: string
      content: string
      userId: string
      username: string
      createdAt: string
    }>>(`/v1/note/${noteId}/comments`)
  }

  // 👤 ユーザー関連API
  async getUserDetail(username: string): Promise<APIResponse<UserData>> {
    return this.makeRequest<UserData>(`/v2/creators/${username}`)
  }

  async getUserArticles(username: string, page = 1): Promise<APIResponse<NoteData[]>> {
    const params = new URLSearchParams({
      kind: 'note',
      page: page.toString()
    })
    
    return this.makeRequest<NoteData[]>(`/v2/creators/${username}/contents?${params}`)
  }

  async getUserFollowers(username: string): Promise<APIResponse<UserData[]>> {
    return this.makeRequest<UserData[]>(`/v1/followers/${username}/list`)
  }

  async getUserFollowing(username: string): Promise<APIResponse<UserData[]>> {
    return this.makeRequest<UserData[]>(`/v1/followings/${username}/list`)
  }

  // 📂 カテゴリー関連API
  async getCategories(): Promise<APIResponse<CategoryData[]>> {
    return this.makeRequest<CategoryData[]>('/v2/categories')
  }

  async getCategoryArticles(categorySlug: string, page = 1): Promise<APIResponse<NoteData[]>> {
    const params = new URLSearchParams({
      note_intro_only: 'true',
      sort: 'new',
      page: page.toString()
    })
    
    return this.makeRequest<NoteData[]>(`/v1/categories/${categorySlug}?${params}`)
  }

  // 🏷️ ハッシュタグ関連API
  async getHashtags(): Promise<APIResponse<HashtagData[]>> {
    return this.makeRequest<HashtagData[]>('/v2/hashtags')
  }

  async getHashtagDetail(hashtag: string): Promise<APIResponse<HashtagData>> {
    return this.makeRequest<HashtagData>(`/v2/hashtags/${encodeURIComponent(hashtag)}`)
  }

  // 📊 統計関連API
  async getStats(): Promise<APIResponse<{
    totalViews: number
    articles: Array<{
      id: string
      title: string
      views: number
      likes: number
    }>
  }>> {
    const params = new URLSearchParams({
      filter: 'all',
      page: '1',
      sort: 'pv'
    })
    
    return this.makeRequest<{
      totalViews: number
      articles: Array<{
        id: string
        title: string
        views: number
        likes: number
      }>
    }>(`/v1/stats/pv?${params}`)
  }

  // 📊 トレンド分析のためのデータ取得
  async getTrendingArticles(category?: string): Promise<APIResponse<NoteData[]>> {
    if (category) {
      return this.getCategoryArticles(category, 1)
    }
    
    // 人気記事を検索で取得
    return this.searchArticles({
      context: 'note',
      q: '',
      size: 50,
      start: 0
    })
  }

  async getPopularHashtags(): Promise<APIResponse<HashtagData[]>> {
    return this.getHashtags()
  }

  // 🔄 一括データ取得（効率的なデータ収集用）
  async bulkFetchUserData(usernames: string[]): Promise<Map<string, UserData>> {
    const results = new Map<string, UserData>()
    
    for (const username of usernames) {
      try {
        const { data, error } = await this.getUserDetail(username)
        if (data && !error) {
          results.set(username, data)
        }
        
        // レート制限を考慮した小さな遅延
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.warn(`Failed to fetch user data for ${username}:`, error)
      }
    }
    
    return results
  }

  async bulkFetchArticleData(noteIds: string[]): Promise<Map<string, NoteData>> {
    const results = new Map<string, NoteData>()
    
    for (const noteId of noteIds) {
      try {
        const { data, error } = await this.getArticleDetail(noteId)
        if (data && !error) {
          results.set(noteId, data)
        }
        
        // レート制限を考慮した小さな遅延
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.warn(`Failed to fetch article data for ${noteId}:`, error)
      }
    }
    
    return results
  }

  // 🎯 Note Booster用の分析データ取得
  async getEngagementAnalytics(username: string): Promise<{
    user: UserData | null
    articles: NoteData[]
    avgEngagement: number
    topTags: string[]
    bestTimes: string[]
  }> {
    try {
      const [userResult, articlesResult] = await Promise.all([
        this.getUserDetail(username),
        this.getUserArticles(username, 1)
      ])

      const user = userResult.data
      const articles = articlesResult.data || []

      // エンゲージメント分析
      const avgEngagement = articles.length > 0 
        ? articles.reduce((sum, article) => sum + (article.likeCount || 0), 0) / articles.length
        : 0

      // タグ分析
      const tagCount = new Map<string, number>()
      articles.forEach(article => {
        article.tags?.forEach(tag => {
          tagCount.set(tag, (tagCount.get(tag) || 0) + 1)
        })
      })
      
      const topTags = Array.from(tagCount.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([tag]) => tag)

      return {
        user,
        articles,
        avgEngagement,
        topTags,
        bestTimes: ['19:00-21:00', '20:00-22:00'] // デフォルト値（実際は時間別分析が必要）
      }
    } catch (error) {
      console.error('Failed to get engagement analytics:', error)
      return {
        user: null,
        articles: [],
        avgEngagement: 0,
        topTags: [],
        bestTimes: []
      }
    }
  }
}

// シングルトンインスタンス
export const noteAPI = new NoteAPIClient()

// ヘルパー関数
export const extractNoteIdFromUrl = (url: string): string | null => {
  const match = url.match(/\/n\/([a-zA-Z0-9]+)/)
  return match ? match[1] : null
}

export const extractUsernameFromUrl = (url: string): string | null => {
  const match = url.match(/note\.com\/([^\/]+)/)
  return match ? match[1] : null
}

export const formatNoteUrl = (noteId: string): string => {
  return `https://note.com/n/${noteId}`
}

export const formatUserUrl = (username: string): string => {
  return `https://note.com/${username}`
} 