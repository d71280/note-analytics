import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Eye, Heart, MessageCircle, Clock } from 'lucide-react'

export default function TrendsPage() {
  // サンプルデータ
  const trendingArticles = [
    {
      id: 1,
      title: 'ChatGPTを使った効率的な記事作成術',
      author: 'テックライター',
      likes: 1250,
      views: 5800,
      comments: 45,
      category: 'テクノロジー',
      trendScore: 95
    },
    {
      id: 2,
      title: '2024年に学ぶべきプログラミング言語5選',
      author: 'エンジニア太郎',
      likes: 980,
      views: 4200,
      comments: 38,
      category: 'テクノロジー',
      trendScore: 88
    },
    {
      id: 3,
      title: 'ミニマリストになって変わった10のこと',
      author: 'シンプルライフ',
      likes: 850,
      views: 3900,
      comments: 52,
      category: 'ライフスタイル',
      trendScore: 82
    }
  ]

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
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">過去24時間</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均エンゲージメント</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2%</div>
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
                {trendingArticles.map((article) => (
                  <div key={article.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{article.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">by {article.author}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {article.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {article.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          {article.comments}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {article.category}
                      </span>
                      <p className="text-sm font-semibold text-gray-900 mt-2">
                        スコア: {article.trendScore}
                      </p>
                    </div>
                  </div>
                ))}
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