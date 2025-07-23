'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { noteAPI } from '@/lib/api/note-api-client'
import { 
  Loader2, 
  Search, 
  TrendingUp, 
  Users, 
  Hash, 
  Calendar,
  Star,
  MessageCircle,
  ExternalLink
} from 'lucide-react'

interface RealAnalyticsProps {
  defaultUsername?: string
}

interface AnalyticsData {
  user: {
    id: string
    username: string
    displayName: string
    bio?: string
    followerCount: number
    noteCount: number
    url: string
  }
  articles: Array<{
    id: string
    title: string
    excerpt?: string
    likeCount: number
    commentCount: number
    tags?: string[]
    url: string
  }>
  avgEngagement: number
  topTags: string[]
  totalLikes: number
  totalComments: number
  avgLikesPerArticle: number
  mostPopularArticle: {
    id: string
    title: string
    excerpt?: string
    likeCount: number
    commentCount: number
    url: string
  } | null
}

export default function RealAnalytics({ defaultUsername = '' }: RealAnalyticsProps) {
  const [username, setUsername] = useState(defaultUsername)
  const [isLoading, setIsLoading] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async (targetUsername: string) => {
    if (!targetUsername.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      // Note APIを使用してエンゲージメント分析を取得
      const analytics = await noteAPI.getEngagementAnalytics(targetUsername.trim())
      
      if (!analytics.user) {
        throw new Error('ユーザーが見つかりませんでした')
      }

      // 詳細な分析データを計算
      const totalLikes = analytics.articles.reduce((sum, article) => sum + (article.likeCount || 0), 0)
      const totalComments = analytics.articles.reduce((sum, article) => sum + (article.commentCount || 0), 0)
      const avgLikesPerArticle = analytics.articles.length > 0 ? totalLikes / analytics.articles.length : 0

      // 最も人気の記事を取得
      const mostPopularArticle = analytics.articles.length > 0
        ? analytics.articles.reduce((prev, current) => 
            (prev.likeCount || 0) > (current.likeCount || 0) ? prev : current
          )
        : null

      setAnalyticsData({
        user: analytics.user,
        articles: analytics.articles,
        avgEngagement: analytics.avgEngagement,
        topTags: analytics.topTags,
        totalLikes,
        totalComments,
        avgLikesPerArticle,
        mostPopularArticle
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : '分析データの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchAnalytics(username)
  }

  // デフォルトユーザーがある場合は自動で取得
  useEffect(() => {
    if (defaultUsername) {
      fetchAnalytics(defaultUsername)
    }
  }, [defaultUsername])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            リアルタイム分析
          </CardTitle>
          <CardDescription>
            NoteユーザーのIDを入力して、実際のデータを基に分析を行います
            <br />
            <span className="text-blue-600 text-sm">
              💡 <code className="bg-blue-50 px-1 rounded">demo</code> と入力するとサンプルデータで機能をお試しいただけます
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="username" className="sr-only">ユーザーID</Label>
              <Input
                id="username"
                placeholder="Noteユーザー名を入力 (例: ego_station)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={!username.trim() || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  分析中
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  分析開始
                </>
              )}
            </Button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="text-red-600">⚠️</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 mb-2">
                    Note APIへの接続に問題があります
                  </p>
                  <p className="text-sm text-red-700 mb-3">{error}</p>
                  <div className="bg-white p-3 rounded border border-red-200">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>💡 解決方法:</strong>
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• ネットワーク接続を確認してください</li>
                      <li>• しばらく時間をおいてから再試行してください</li>
                      <li>• <code className="bg-gray-100 px-1 rounded">demo</code> と入力するとデモデータで機能を確認できます</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {analyticsData && (
        <>
          {/* ユーザー情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                クリエイター情報
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{analyticsData.user.displayName}</h3>
                  <p className="text-gray-600 mb-4">@{analyticsData.user.username}</p>
                  
                  {analyticsData.user.bio && (
                    <p className="text-sm text-gray-700 mb-4">{analyticsData.user.bio}</p>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {analyticsData.user.followerCount?.toLocaleString() || '0'}
                      </div>
                      <div className="text-xs text-gray-500">フォロワー</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {analyticsData.user.noteCount?.toLocaleString() || '0'}
                      </div>
                      <div className="text-xs text-gray-500">記事数</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.round(analyticsData.avgLikesPerArticle)}
                      </div>
                      <div className="text-xs text-gray-500">平均いいね</div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(analyticsData.user.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* エンゲージメント統計 */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <div className="flex-1">
                    <div className="text-2xl font-bold">{analyticsData.totalLikes.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">総いいね数</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-blue-500" />
                  <div className="flex-1">
                    <div className="text-2xl font-bold">{analyticsData.totalComments.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">総コメント数</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <div className="text-2xl font-bold">
                      {(analyticsData.avgEngagement * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">エンゲージメント率</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  <div className="flex-1">
                    <div className="text-2xl font-bold">{analyticsData.articles.length}</div>
                    <div className="text-xs text-gray-500">分析対象記事</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* トップタグ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                よく使用するタグ
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsData.topTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {analyticsData.topTags.map((tag, index) => (
                    <span 
                      key={tag} 
                      className={`px-2 py-1 rounded-full text-sm font-medium ${
                        index === 0 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">タグ情報がありません</p>
              )}
            </CardContent>
          </Card>

          {/* 最も人気の記事 */}
          {analyticsData.mostPopularArticle && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  最も人気の記事
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">{analyticsData.mostPopularArticle.title}</h3>
                    {analyticsData.mostPopularArticle.excerpt && (
                      <p className="text-sm text-gray-600 mb-3">
                        {analyticsData.mostPopularArticle.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        {analyticsData.mostPopularArticle.likeCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {analyticsData.mostPopularArticle.commentCount || 0}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => analyticsData.mostPopularArticle && window.open(analyticsData.mostPopularArticle.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 記事一覧 */}
          <Card>
            <CardHeader>
              <CardTitle>最近の記事</CardTitle>
              <CardDescription>
                分析対象の記事一覧（最大20件）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.articles.slice(0, 10).map((article, index) => (
                  <div key={article.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1">{article.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {article.likeCount || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {article.commentCount || 0}
                        </span>
                        {article.tags && article.tags.length > 0 && (
                          <span>#{article.tags[0]}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(article.url, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
} 