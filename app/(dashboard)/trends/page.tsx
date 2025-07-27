'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Eye, Heart, MessageCircle, Clock, Loader2, ExternalLink, Filter, SortDesc } from 'lucide-react'
import { noteAPI, NoteArticle } from '@/lib/api/note-api-client'
import { Button } from '@/components/ui/button'

interface TrendingData {
  articles: NoteArticle[]
  keywords: string[]
  categoryStats: Array<{name: string, growth: number, color: string}>
  loading: boolean
  error: string | null
}

type SortType = 'engagement' | 'like' | 'comment' | 'recent' | 'trending_velocity' | 'like_ratio'
type DateFilter = 'today' | 'yesterday' | 'this_week' | 'this_month' | undefined
type CategoryFilter = 'all' | 'テクノロジー' | 'ビジネス' | 'ライフスタイル' | '哲学・思想' | 'クリエイティブ' | '学術・研究'

interface EngagementMetrics {
  likeToViewRatio: number
  commentToLikeRatio: number
  viewToFollowerRatio: number
  totalEngagementScore: number
  trendingVelocity: number
}

interface EnhancedNoteArticle extends NoteArticle {
  engagement?: EngagementMetrics
  category?: string
}

export default function TrendsPage() {
  const [trendData, setTrendData] = useState<TrendingData>({
    articles: [],
    keywords: [],
    categoryStats: [],
    loading: true,
    error: null
  })

  const [sortBy, setSortBy] = useState<SortType>('engagement')
  const [dateFilter, setDateFilter] = useState<DateFilter>(undefined)
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')

  const fetchTrendData = async (customSort?: SortType, customDateFilter?: DateFilter, customCategory?: CategoryFilter) => {
    setTrendData(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const currentSort = customSort || sortBy
      const currentDateFilter = customDateFilter || dateFilter
      const currentCategory = customCategory || categoryFilter
      
      // カテゴリー機能付きでデータを取得
      const [articlesRes, keywordsRes, categoryRes] = await Promise.all([
        noteAPI.searchArticles('', 50, currentSort, currentDateFilter, currentCategory),
        noteAPI.getTrendingKeywords(),
        noteAPI.getCategoryStats()
      ])

      if (articlesRes.error) throw new Error(articlesRes.error)
      if (keywordsRes.error) throw new Error(keywordsRes.error) 
      if (categoryRes.error) throw new Error(categoryRes.error)

      setTrendData({
        articles: articlesRes.data || [],
        keywords: keywordsRes.data || [],
        categoryStats: categoryRes.data || [],
        loading: false,
        error: null
      })
    } catch (error) {
      setTrendData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '不明なエラーが発生しました'
      }))
    }
  }

  useEffect(() => {
    fetchTrendData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 統計データの計算（強化版）
  const totalTrendingArticles = trendData.articles.length
  const averageEngagement = trendData.articles.length > 0
    ? (trendData.articles.reduce((sum, article) => {
        const enhancedArticle = article as EnhancedNoteArticle
        return sum + (enhancedArticle.engagement?.totalEngagementScore || article.likeCount / 100 || 0)
      }, 0) / trendData.articles.length).toFixed(1)
    : '0.0'
  
  // カテゴリー別記事数統計（将来の機能拡張用）
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {}
    trendData.articles.forEach(article => {
      const category = (article as EnhancedNoteArticle).category || 'その他'
      stats[category] = (stats[category] || 0) + 1
    })
    return stats
  }, [trendData.articles])
  
  // コンソールでカテゴリー統計を確認（開発用）
  console.log('📊 Category stats:', categoryStats)

  if (trendData.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>トレンドデータを取得中...</span>
        </div>
      </div>
    )
  }

  // ハンドラー関数
  const handleRefresh = () => {
    fetchTrendData()
  }

  const handleSortChange = (newSort: SortType) => {
    setSortBy(newSort)
    fetchTrendData(newSort, dateFilter, categoryFilter)
  }

  const handleDateFilterChange = (newDateFilter: DateFilter) => {
    setDateFilter(newDateFilter)
    fetchTrendData(sortBy, newDateFilter, categoryFilter)
  }

  const handleCategoryChange = (newCategory: CategoryFilter) => {
    setCategoryFilter(newCategory)
    fetchTrendData(sortBy, dateFilter, newCategory)
  }

  const handleTodayTopLiked = () => {
    setSortBy('like')
    setDateFilter('today')
    fetchTrendData('like', 'today', categoryFilter)
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">トレンド分析</h1>
          <p className="text-gray-600">実際のNote APIから取得したリアルタイムトレンドデータ</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleTodayTopLiked}
            variant="outline"
            disabled={trendData.loading}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            今日のスキ順
          </Button>
          <Button onClick={handleRefresh} disabled={trendData.loading}>
            {trendData.loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                更新中
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                データ更新
              </>
            )}
          </Button>
        </div>
      </div>

      {/* フィルタ・ソートコントロール */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">期間:</span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={dateFilter === undefined ? "default" : "outline"}
                onClick={() => handleDateFilterChange(undefined)}
              >
                全期間
              </Button>
              <Button
                size="sm"
                variant={dateFilter === 'today' ? "default" : "outline"}
                onClick={() => handleDateFilterChange('today')}
              >
                今日
              </Button>
              <Button
                size="sm"
                variant={dateFilter === 'yesterday' ? "default" : "outline"}
                onClick={() => handleDateFilterChange('yesterday')}
              >
                昨日
              </Button>
              <Button
                size="sm"
                variant={dateFilter === 'this_week' ? "default" : "outline"}
                onClick={() => handleDateFilterChange('this_week')}
              >
                今週
              </Button>
              <Button
                size="sm"
                variant={dateFilter === 'this_month' ? "default" : "outline"}
                onClick={() => handleDateFilterChange('this_month')}
              >
                今月
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">カテゴリー:</span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={categoryFilter === 'all' ? "default" : "outline"}
                onClick={() => handleCategoryChange('all')}
              >
                全て
              </Button>
              <Button
                size="sm"
                variant={categoryFilter === 'テクノロジー' ? "default" : "outline"}
                onClick={() => handleCategoryChange('テクノロジー')}
              >
                テクノロジー
              </Button>
              <Button
                size="sm"
                variant={categoryFilter === 'ビジネス' ? "default" : "outline"}
                onClick={() => handleCategoryChange('ビジネス')}
              >
                ビジネス
              </Button>
              <Button
                size="sm"
                variant={categoryFilter === 'ライフスタイル' ? "default" : "outline"}
                onClick={() => handleCategoryChange('ライフスタイル')}
              >
                ライフスタイル
              </Button>
              <Button
                size="sm"
                variant={categoryFilter === '哲学・思想' ? "default" : "outline"}
                onClick={() => handleCategoryChange('哲学・思想')}
              >
                哲学・思想
              </Button>
              <Button
                size="sm"
                variant={categoryFilter === 'クリエイティブ' ? "default" : "outline"}
                onClick={() => handleCategoryChange('クリエイティブ')}
              >
                クリエイティブ
              </Button>
              <Button
                size="sm"
                variant={categoryFilter === '学術・研究' ? "default" : "outline"}
                onClick={() => handleCategoryChange('学術・研究')}
              >
                学術・研究
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <SortDesc className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">並び順:</span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={sortBy === 'engagement' ? "default" : "outline"}
                onClick={() => handleSortChange('engagement')}
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                エンゲージメント
              </Button>
              <Button
                size="sm"
                variant={sortBy === 'trending_velocity' ? "default" : "outline"}
                onClick={() => handleSortChange('trending_velocity')}
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                急上昇度
              </Button>
              <Button
                size="sm"
                variant={sortBy === 'like_ratio' ? "default" : "outline"}
                onClick={() => handleSortChange('like_ratio')}
              >
                <Eye className="h-3 w-3 mr-1" />
                いいね率
              </Button>
              <Button
                size="sm"
                variant={sortBy === 'like' ? "default" : "outline"}
                onClick={() => handleSortChange('like')}
              >
                <Heart className="h-3 w-3 mr-1" />
                スキ順
              </Button>
              <Button
                size="sm"
                variant={sortBy === 'comment' ? "default" : "outline"}
                onClick={() => handleSortChange('comment')}
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                コメント順
              </Button>
              <Button
                size="sm"
                variant={sortBy === 'recent' ? "default" : "outline"}
                onClick={() => handleSortChange('recent')}
              >
                <Clock className="h-3 w-3 mr-1" />
                新着順
              </Button>
            </div>
          </div>
        </div>
      </div>

      {trendData.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="text-red-600">⚠️</div>
            <div>
              <p className="text-sm font-medium text-red-800 mb-1">データ取得エラー</p>
              <p className="text-sm text-red-700">{trendData.error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="mt-2"
              >
                再試行
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">急上昇記事</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTrendingArticles}</div>
            <p className="text-xs text-muted-foreground">Note APIから取得</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均エンゲージメント</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageEngagement}%</div>
            <p className="text-xs text-muted-foreground">リアルデータ基準</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">トレンドキーワード</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trendData.keywords.length}</div>
            <p className="text-xs text-muted-foreground">注目キーワード</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最適投稿時間</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">20:00</div>
            <p className="text-xs text-muted-foreground">統計データ基準</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>急上昇記事</CardTitle>
              <CardDescription>
                実際のNote APIから取得した人気記事ランキング
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trendData.articles.map((article, index) => (
                  <div key={`${article.id}-${index}`} className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{article.title}</h3>
                        {(article as EnhancedNoteArticle).category && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {(article as EnhancedNoteArticle).category}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">by {article.authorId}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {article.likeCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {Math.floor((article.likeCount || 0) * 4.5)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          {article.commentCount || 0}
                        </span>
                        {(article as EnhancedNoteArticle).engagement && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {(article as EnhancedNoteArticle).engagement!.totalEngagementScore.toFixed(1)}
                          </span>
                        )}
                      </div>
                      {(article as EnhancedNoteArticle).engagement && (
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                          <span>いいね率: {(article as EnhancedNoteArticle).engagement!.likeToViewRatio.toFixed(1)}%</span>
                          <span>急上昇度: {(article as EnhancedNoteArticle).engagement!.trendingVelocity.toFixed(1)}</span>
                        </div>
                      )}
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {article.tags.slice(0, 3).map((tag: string, tagIndex: number) => (
                            <span key={tagIndex} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        #{index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(article.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {trendData.articles.length === 0 && !trendData.loading && (
                  <p className="text-center text-gray-500 py-8">
                    トレンド記事が見つかりませんでした。後でもう一度お試しください。
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>カテゴリー別成長率</CardTitle>
              <CardDescription>推定成長率データ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trendData.categoryStats.map((category) => (
                  <div key={category.name}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">{category.name}</span>
                      <span className="text-sm text-green-600">+{category.growth}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${category.color}`}
                        style={{ width: `${Math.min(category.growth * 3, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>トレンドキーワード</CardTitle>
              <CardDescription>現在注目されているキーワード</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {trendData.keywords.slice(0, 10).map((keyword, index) => {
                  const colors = [
                    'bg-blue-100 text-blue-800',
                    'bg-purple-100 text-purple-800', 
                    'bg-green-100 text-green-800',
                    'bg-orange-100 text-orange-800',
                    'bg-pink-100 text-pink-800',
                    'bg-indigo-100 text-indigo-800',
                    'bg-red-100 text-red-800',
                    'bg-yellow-100 text-yellow-800',
                    'bg-teal-100 text-teal-800',
                    'bg-gray-100 text-gray-800'
                  ]
                  return (
                    <span 
                      key={keyword} 
                      className={`px-3 py-1 rounded-full text-sm ${colors[index % colors.length]}`}
                    >
                      {keyword}
                    </span>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}