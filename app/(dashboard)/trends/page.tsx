import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Eye, Heart, MessageCircle, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function TrendsPage() {
  const supabase = createClient()
  
  // 実際のデータをSupabaseから取得
  const { data: trendingArticles } = await supabase
    .from('trending_articles')
    .select(`
      trending_score,
      trending_date,
      articles!inner (
        id,
        title,
        like_count,
        comment_count,
        published_at,
        tags,
        creators!inner (
          display_name
        )
      ),
      categories (
        name
      )
    `)
    .order('trending_score', { ascending: false })
    .limit(10)

  // 統計データの計算
  const totalTrendingArticles = trendingArticles?.length || 0
  const averageEngagement = trendingArticles?.length 
    ? (trendingArticles.reduce((sum, item) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const article = item.articles as any
        return sum + (article?.like_count || 0)
      }, 0) / trendingArticles.length / 100).toFixed(1)
    : '0.0'

  // カテゴリー別成長率の計算（サンプル）
  const categoryTrends = [
    { name: 'テクノロジー', growth: 32, color: 'bg-purple-500' },
    { name: 'ビジネス', growth: 28, color: 'bg-blue-500' },
    { name: 'ライフスタイル', growth: 15, color: 'bg-pink-500' },
    { name: 'エンタメ', growth: 12, color: 'bg-orange-500' },
    { name: 'クリエイティブ', growth: 8, color: 'bg-green-500' }
  ]

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-gray-900">トレンド分析</h1>
      
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">急上昇記事</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTrendingArticles}</div>
            <p className="text-xs text-muted-foreground">過去24時間</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均エンゲージメント</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageEngagement}%</div>
            <p className="text-xs text-muted-foreground">+0.8% from last week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">トレンドキーワード</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">新規トレンド</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最適投稿時間</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">20:00</div>
            <p className="text-xs text-muted-foreground">平日の夜間</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>急上昇記事</CardTitle>
              <CardDescription>過去24時間で最もエンゲージメントが高い記事</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trendingArticles?.map((item) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const article = item.articles as any
                  if (!article) return null
                  
                  return (
                    <div key={article.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{article.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">by {article.creators?.display_name || 'Unknown'}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {article.like_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {Math.floor((article.like_count || 0) * 4.5)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {article.comment_count}
                          </span>
                        </div>
                        {article.tags && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {article.tags.slice(0, 3).map((tag: string, tagIndex: number) => (
                              <span key={tagIndex} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {(item.categories as any)?.name || 'その他'}
                        </span>
                        <p className="text-sm font-semibold text-gray-900 mt-2">
                          スコア: {Math.round(item.trending_score || 0)}
                        </p>
                      </div>
                    </div>
                  )
                })}
                
                {(!trendingArticles || trendingArticles.length === 0) && (
                  <p className="text-center text-gray-500 py-8">
                    まだトレンド記事がありません。記事データを追加してください。
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
              <CardDescription>過去7日間の成長率</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryTrends.map((category) => (
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
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">AI</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">ChatGPT</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">副業</span>
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">投資</span>
                <span className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm">健康</span>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">プログラミング</span>
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">転職</span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">節約</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}