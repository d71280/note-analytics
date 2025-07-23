/**
 * Note API Client
 * 
 * Note.comの非公式APIクライアント
 * 参考: https://note.com/ego_station/n/n1a0b26f944f4
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// レート制限管理クラス
class RateLimiter {
  private requests: number[] = []
  private readonly maxRequests: number
  private readonly timeWindow: number

  constructor(maxRequests: number = 60, timeWindowMs: number = 60000) {
    this.maxRequests = maxRequests
    this.timeWindow = timeWindowMs
  }

  async waitIfNeeded(): Promise<void> {
    const now = Date.now()
    this.requests = this.requests.filter(timestamp => now - timestamp < this.timeWindow)

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests)
      const waitTime = this.timeWindow - (now - oldestRequest)
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime))
        return this.waitIfNeeded()
      }
    }

    this.requests.push(now)
  }
}

// API応答の型定義
interface RawNoteUser {
  id: string
  urlname: string
  name: string
  description?: string
  followerCount?: number
  followingCount?: number
  noteCount?: number
  userProfileImageUrl?: string
  userHeaderImageUrl?: string
}

interface RawNoteArticle {
  key: string
  name: string
  description?: string
  body?: string
  user?: { urlname: string }
  publishAt?: string
  createdAt?: string
  likeCount?: number
  commentCount?: number
  hashtags?: Array<{ name: string }>
  eyecatch?: string
}

interface RawNoteCategory {
  id: number
  name: string
  urlname: string
  icon?: string
  color?: string
}

interface RawApiResponse {
  data?: {
    contents?: RawNoteArticle[]
  } | RawNoteUser | RawNoteArticle | RawNoteCategory[]
}

export interface NoteUser {
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

export interface NoteArticle {
  id: string
  title: string
  excerpt?: string
  content?: string
  authorId: string
  publishedAt: string
  likeCount: number
  commentCount: number
  tags?: string[]
  thumbnailUrl?: string
  url: string
}

export interface NoteCategory {
  id: number
  name: string
  slug: string
  icon?: string
  color?: string
}

export interface SearchResult {
  type: 'article' | 'user'
  data: NoteArticle | NoteUser
}

export interface EngagementAnalytics {
  user: NoteUser
  articles: NoteArticle[]
  avgEngagement: number
  topTags: string[]
}

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  status: number
}

// Note APIクライアントクラス
class NoteAPIClient {
  private readonly baseUrl = '/api/note-proxy' // プロキシを使用
  private readonly rateLimiter = new RateLimiter(30, 60000) // 30 requests per minute (控えめに設定)

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    await this.rateLimiter.waitIfNeeded()

    try {
      // プロキシ経由でNote APIにアクセス
      const proxyUrl = `${this.baseUrl}?endpoint=${encodeURIComponent(endpoint)}`
      console.log('🔍 Note API Request via Proxy:', proxyUrl)
      
      const response = await fetch(proxyUrl, {
        ...options,
        method: 'GET',
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      if (!response.ok) {
        // より詳細なエラー情報
        const errorText = await response.text().catch(() => 'Unable to read error response')
        return {
          data: null,
          error: `HTTP ${response.status} (${response.statusText}): ${errorText}`,
          status: response.status
        }
      }

      const data = await response.json()
      return {
        data,
        error: null,
        status: response.status
      }
    } catch (error) {
      // ネットワークエラーやプロキシエラーの詳細ログ
      console.error('Note API Request Failed:', {
        endpoint,
        proxyUrl: `${this.baseUrl}?endpoint=${encodeURIComponent(endpoint)}`,
        error: error instanceof Error ? error.message : error,
      })
      
      return {
        data: null,
        error: error instanceof Error 
          ? `Network Error: ${error.message}` 
          : 'Unknown network error',
        status: 0
      }
    }
  }

  // ユーザー情報取得
  async getUserDetail(username: string): Promise<ApiResponse<NoteUser>> {
    const response = await this.makeRequest<RawApiResponse>(`/api/v2/creators/${username}`)
    
    if (response.error || !response.data) {
      return response as ApiResponse<NoteUser>
    }

    const userData = (response.data.data as RawNoteUser) || (response.data as RawNoteUser)
    const user: NoteUser = {
      id: userData.id || username,
      username: userData.urlname || username,
      displayName: userData.name || username,
      bio: userData.description,
      followerCount: userData.followerCount || 0,
      followingCount: userData.followingCount || 0,
      noteCount: userData.noteCount || 0,
      avatarUrl: userData.userProfileImageUrl,
      headerImageUrl: userData.userHeaderImageUrl,
      url: `https://note.com/${username}`
    }

    return {
      data: user,
      error: null,
      status: response.status
    }
  }

  // 記事詳細取得
  async getArticleDetail(noteId: string): Promise<ApiResponse<NoteArticle>> {
    const response = await this.makeRequest<RawApiResponse>(`/api/v3/notes/${noteId}`)
    
    if (response.error || !response.data) {
      return response as ApiResponse<NoteArticle>
    }

    const articleData = (response.data.data as RawNoteArticle) || (response.data as RawNoteArticle)
          const article: NoteArticle = {
        id: articleData.key || noteId,
        title: articleData.name || 'Untitled',
        excerpt: articleData.description,
        content: articleData.body,
        authorId: articleData.user?.urlname || '',
        publishedAt: articleData.publishAt || articleData.createdAt || '',
        likeCount: articleData.likeCount || 0,
        commentCount: articleData.commentCount || 0,
        tags: articleData.hashtags?.map(tag => tag.name) || [],
        thumbnailUrl: articleData.eyecatch,
        url: `https://note.com/${articleData.user?.urlname}/n/${noteId}`
      }

    return {
      data: article,
      error: null,
      status: response.status
    }
  }

  // ユーザーの記事一覧取得
  async getUserArticles(username: string, limit: number = 20): Promise<ApiResponse<NoteArticle[]>> {
    const response = await this.makeRequest<RawApiResponse>(`/api/v2/creators/${username}/contents?kind=note&page=1&per=${limit}`)
    
    if (response.error || !response.data) {
      return response as ApiResponse<NoteArticle[]>
    }

    const articlesData = (response.data.data as { contents: RawNoteArticle[] })?.contents || []
    const articles: NoteArticle[] = articlesData.map((item: RawNoteArticle) => ({
      id: item.key,
      title: item.name,
      excerpt: item.description,
      authorId: username,
      publishedAt: item.publishAt || item.createdAt || '',
      likeCount: item.likeCount || 0,
      commentCount: item.commentCount || 0,
      tags: item.hashtags?.map(tag => tag.name) || [],
      thumbnailUrl: item.eyecatch,
      url: `https://note.com/${username}/n/${item.key}`
    }))

    return {
      data: articles,
      error: null,
      status: response.status
    }
  }

  // カテゴリー一覧取得
  async getCategories(): Promise<ApiResponse<NoteCategory[]>> {
    const response = await this.makeRequest<RawApiResponse>('/api/v2/categories')
    
    if (response.error || !response.data) {
      return response as ApiResponse<NoteCategory[]>
    }

    const categoriesData = (response.data.data as RawNoteCategory[]) || []
    const categories: NoteCategory[] = categoriesData.map((item: RawNoteCategory) => ({
      id: item.id,
      name: item.name,
      slug: item.urlname,
      icon: item.icon,
      color: item.color
    }))

    return {
      data: categories,
      error: null,
      status: response.status
    }
  }

  // 記事検索
  async searchArticles(query: string, page: number = 1): Promise<ApiResponse<NoteArticle[]>> {
    const response = await this.makeRequest<RawApiResponse>(`/api/v2/searches/notes?q=${encodeURIComponent(query)}&page=${page}`)
    
    if (response.error || !response.data) {
      return response as ApiResponse<NoteArticle[]>
    }

    const articlesData = (response.data.data as { contents: RawNoteArticle[] })?.contents || []
    const articles: NoteArticle[] = articlesData.map((item: RawNoteArticle) => ({
      id: item.key,
      title: item.name,
      excerpt: item.description,
      authorId: item.user?.urlname || '',
      publishedAt: item.publishAt || item.createdAt || '',
      likeCount: item.likeCount || 0,
      commentCount: item.commentCount || 0,
      tags: item.hashtags?.map(tag => tag.name) || [],
      thumbnailUrl: item.eyecatch,
      url: `https://note.com/${item.user?.urlname}/n/${item.key}`
    }))

    return {
      data: articles,
      error: null,
      status: response.status
    }
  }

  // ユーザー検索
  async searchUsers(query: string, page: number = 1): Promise<ApiResponse<NoteUser[]>> {
    const response = await this.makeRequest<RawApiResponse>(`/api/v2/searches/creators?q=${encodeURIComponent(query)}&page=${page}`)
    
    if (response.error || !response.data) {
      return response as ApiResponse<NoteUser[]>
    }

    const usersData = (response.data as any)?.data?.contents || []
    const users: NoteUser[] = usersData.map((item: any) => ({
      id: item.id,
      username: item.urlname,
      displayName: item.name,
      bio: item.description,
      followerCount: item.followerCount || 0,
      followingCount: item.followingCount || 0,
      noteCount: item.noteCount || 0,
      avatarUrl: item.userProfileImageUrl,
      headerImageUrl: item.userHeaderImageUrl,
      url: `https://note.com/${item.urlname}`
    }))

    return {
      data: users,
      error: null,
      status: response.status
    }
  }

  // エンゲージメント分析（ユーザーと記事データを組み合わせ）
  async getEngagementAnalytics(username: string): Promise<EngagementAnalytics> {
    const [userResponse, articlesResponse] = await Promise.all([
      this.getUserDetail(username),
      this.getUserArticles(username, 20)
    ])

    if (userResponse.error || !userResponse.data) {
      throw new Error(`ユーザー情報の取得に失敗: ${userResponse.error}`)
    }

    if (articlesResponse.error || !articlesResponse.data) {
      throw new Error(`記事情報の取得に失敗: ${articlesResponse.error}`)
    }

    const user = userResponse.data
    const articles = articlesResponse.data

    // エンゲージメント率の計算
    const totalEngagement = articles.reduce((sum, article) => 
      sum + (article.likeCount || 0) + (article.commentCount || 0), 0
    )
    const avgEngagement = user.followerCount > 0 
      ? totalEngagement / (user.followerCount * articles.length) 
      : 0

    // トップタグの抽出
    const tagCounts: Record<string, number> = {}
    articles.forEach(article => {
      article.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })
    const topTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag)

    return {
      user,
      articles,
      avgEngagement,
      topTags
    }
  }
}

// ユーティリティ関数
export function extractNoteIdFromUrl(url: string): string | null {
  const match = url.match(/\/n\/([a-zA-Z0-9]+)/)
  return match ? match[1] : null
}

export function extractUsernameFromUrl(url: string): string | null {
  const match = url.match(/note\.com\/([^\/]+)/)
  return match ? match[1] : null
}



// シングルトンインスタンス（実際のAPIのみ使用）
export const noteAPI = new NoteAPIClient()

export default noteAPI 