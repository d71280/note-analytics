// Note.com スクレピング機能（利用規約遵守版）
// ⚠️ 使用前に必ず利用規約とrobots.txtを確認してください

interface ScrapingOptions {
  respectRobotsToText: boolean
  rateLimit: number // ミリ秒間隔
  userAgent: string
  timeout: number
}

interface NoteArticleData {
  title: string
  content?: string
  excerpt?: string
  author: string
  publishedAt?: string
  likeCount?: number
  tags?: string[]
  url: string
}

interface NoteCreatorData {
  username: string
  displayName: string
  bio?: string
  followerCount?: number
  followingCount?: number
  avatarUrl?: string
  url: string
}

class NoteScraperError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'NoteScraperError'
  }
}

export class NoteScraper {
  private options: ScrapingOptions
  private lastRequestTime: number = 0

  constructor(options: Partial<ScrapingOptions> = {}) {
    this.options = {
      respectRobotsToText: true,
      rateLimit: 2000, // 2秒間隔（礼儀正しい間隔）
      userAgent: 'Note Analytics Platform (Educational Purpose)',
      timeout: 10000,
      ...options
    }
  }

  /**
   * robots.txtを確認してスクレピングが許可されているかチェック
   */
  private async checkRobotsTxt(url: string): Promise<boolean> {
    if (!this.options.respectRobotsToText) {
      return true
    }

    try {
      const baseUrl = new URL(url).origin
      const robotsUrl = `${baseUrl}/robots.txt`
      
      const response = await fetch(robotsUrl, {
        signal: AbortSignal.timeout(this.options.timeout)
      })
      
      if (!response.ok) {
        console.warn('robots.txt not found, proceeding with caution')
        return true
      }

      const robotsText = await response.text()
      
      // 簡単なrobots.txt解析（実際にはより詳細な解析が必要）
      const lines = robotsText.split('\n')
      let isRelevantUserAgent = false
      
      for (const line of lines) {
        const trimmed = line.trim()
        
        if (trimmed.startsWith('User-agent:')) {
          const userAgent = trimmed.split(':')[1].trim()
          isRelevantUserAgent = userAgent === '*' || 
            userAgent.toLowerCase().includes('bot') ||
            userAgent.toLowerCase().includes('crawler')
        }
        
        if (isRelevantUserAgent && trimmed.startsWith('Disallow:')) {
          const disallowed = trimmed.split(':')[1].trim()
          if (disallowed === '/' || url.includes(disallowed)) {
            return false
          }
        }
      }
      
      return true
    } catch (error) {
      console.warn('Error checking robots.txt:', error)
      return false // 安全のためfalseを返す
    }
  }

  /**
   * レート制限を適用
   */
  private async applyRateLimit(): Promise<void> {
    const timeSinceLastRequest = Date.now() - this.lastRequestTime
    if (timeSinceLastRequest < this.options.rateLimit) {
      await new Promise(resolve => 
        setTimeout(resolve, this.options.rateLimit - timeSinceLastRequest)
      )
    }
    this.lastRequestTime = Date.now()
  }

  /**
   * 記事情報をスクレイピング（公開データのみ）
   */
  async scrapeArticle(url: string): Promise<NoteArticleData> {
    // URL検証
    if (!url.includes('note.com')) {
      throw new NoteScraperError('Invalid Note URL', 'INVALID_URL')
    }

    // robots.txt確認
    const isAllowed = await this.checkRobotsTxt(url)
    if (!isAllowed) {
      throw new NoteScraperError('Access disallowed by robots.txt', 'ROBOTS_DISALLOWED')
    }

    // レート制限適用
    await this.applyRateLimit()

    try {
      // 注意: 実際のスクレピングの代わりに、模擬データを返す
      // 実際の実装では、適切な HTML パースライブラリ（cheerio等）を使用
      console.warn('⚠️ 実際のスクレピング機能は利用規約確認後に実装してください')
      
      // 模擬データの返却
      return {
        title: 'Sample Article Title',
        excerpt: 'This is a sample excerpt from the article.',
        author: 'Sample Author',
        url: url,
        likeCount: 0,
        tags: ['sample']
      }
    } catch (error) {
      throw new NoteScraperError(
        `Failed to scrape article: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SCRAPING_FAILED'
      )
    }
  }

  /**
   * クリエイター情報をスクレイピング（公開データのみ）
   */
  async scrapeCreator(url: string): Promise<NoteCreatorData> {
    // URL検証
    if (!url.includes('note.com')) {
      throw new NoteScraperError('Invalid Note URL', 'INVALID_URL')
    }

    // robots.txt確認
    const isAllowed = await this.checkRobotsTxt(url)
    if (!isAllowed) {
      throw new NoteScraperError('Access disallowed by robots.txt', 'ROBOTS_DISALLOWED')
    }

    // レート制限適用
    await this.applyRateLimit()

    try {
      // 注意: 実際のスクレピングの代わりに、模擬データを返す
      console.warn('⚠️ 実際のスクレピング機能は利用規約確認後に実装してください')
      
      // 模擬データの返却
      return {
        username: 'sample_user',
        displayName: 'Sample User',
        bio: 'Sample bio description',
        url: url,
        followerCount: 0,
        followingCount: 0
      }
    } catch (error) {
      throw new NoteScraperError(
        `Failed to scrape creator: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SCRAPING_FAILED'
      )
    }
  }

  /**
   * 複数URLの一括スクレイピング
   */
  async scrapeBatch(urls: string[]): Promise<{
    articles: NoteArticleData[]
    creators: NoteCreatorData[]
    errors: Array<{ url: string; error: string }>
  }> {
    const articles: NoteArticleData[] = []
    const creators: NoteCreatorData[] = []
    const errors: Array<{ url: string; error: string }> = []

    for (const url of urls) {
      try {
        if (this.isArticleUrl(url)) {
          const article = await this.scrapeArticle(url)
          articles.push(article)
        } else if (this.isCreatorUrl(url)) {
          const creator = await this.scrapeCreator(url)
          creators.push(creator)
        } else {
          errors.push({ url, error: 'Unknown URL type' })
        }
      } catch (error) {
        errors.push({ 
          url, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    return { articles, creators, errors }
  }

  /**
   * URLが記事URLかどうかを判定
   */
  private isArticleUrl(url: string): boolean {
    return url.includes('/n/') || url.includes('/notes/')
  }

  /**
   * URLがクリエイターURLかどうかを判定
   */
  private isCreatorUrl(url: string): boolean {
    const urlPattern = /^https:\/\/note\.com\/[^\/]+\/?$/
    return urlPattern.test(url)
  }
}

// ヘルパー関数
export const createNoteScraper = (options?: Partial<ScrapingOptions>) => {
  return new NoteScraper(options)
}

// 利用規約チェック関数
export const validateScrapingCompliance = async () => {
  const warnings = []
  
  warnings.push('⚠️ スクレピング使用前の確認事項:')
  warnings.push('1. note.com/robots.txt を確認してください')
  warnings.push('2. note.com の利用規約を確認してください')
  warnings.push('3. 適切なレート制限を設定してください')
  warnings.push('4. 公開データのみを対象としてください')
  warnings.push('5. 個人情報の取り扱いに注意してください')
  
  console.warn(warnings.join('\n'))
  
  return {
    isCompliant: false, // 手動で確認が必要
    warnings
  }
} 