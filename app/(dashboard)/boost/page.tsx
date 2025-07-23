import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
// import { createClient } from '@/lib/supabase/server' // 将来のデータ取得用に保留
import EngagementOptimizer from '@/components/boost/engagement-optimizer'
import RealAnalytics from '@/components/boost/real-analytics'
import { 
  TrendingUp, 
  Users, 
  Target, 
  Clock, 
  Hash, 
  Zap,
  Star,
  BarChart3,
  Calendar,
  Award,
  Lightbulb
} from 'lucide-react'

export default async function BoostPage() {
  // const supabase = createClient() // 将来のデータ取得用に保留
  
  // サンプルデータ（実際のデータが利用可能になったら置き換え）
  const growthMetrics = {
    followersGrowthRate: 15.3,
    avgEngagementRate: 4.7,
    bestPostingTime: '19:00-21:00',
    topPerformingTags: ['ChatGPT', 'AI', 'テクノロジー'],
    weeklyGrowth: 127,
    monthlyGrowth: 524
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Note Booster</h1>
          <p className="text-gray-600">フォロワー増加とエンゲージメント向上のための戦略ダッシュボード</p>
        </div>
        <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
          <Zap className="h-4 w-4 mr-2" />
          ブースト開始
        </Button>
      </div>

      {/* 成長指標 */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">フォロワー成長率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold text-green-600">+{growthMetrics.followersGrowthRate}%</div>
              <TrendingUp className="ml-2 h-5 w-5 text-green-500" />
            </div>
            <p className="text-xs text-gray-500">過去30日間</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">エンゲージメント率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold text-blue-600">{growthMetrics.avgEngagementRate}%</div>
              <Star className="ml-2 h-5 w-5 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500">平均値</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">今週の成長</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold text-purple-600">+{growthMetrics.weeklyGrowth}</div>
              <Users className="ml-2 h-5 w-5 text-purple-500" />
            </div>
            <p className="text-xs text-gray-500">新規フォロワー</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">月間成長</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold text-orange-600">+{growthMetrics.monthlyGrowth}</div>
              <Award className="ml-2 h-5 w-5 text-orange-500" />
            </div>
            <p className="text-xs text-gray-500">新規フォロワー</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 最適投稿時間 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              最適投稿時間分析
            </CardTitle>
            <CardDescription>
              エンゲージメントが最も高い時間帯
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                <div className="text-lg font-semibold text-gray-800">
                  ベストタイム: {growthMetrics.bestPostingTime}
                </div>
                <p className="text-sm text-gray-600">平均エンゲージメント率 +34% 向上</p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">時間帯別パフォーマンス</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">朝 (6:00-12:00)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-400 h-2 rounded-full w-3/5"></div>
                      </div>
                      <span className="text-xs text-gray-500">60%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">昼 (12:00-18:00)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-orange-400 h-2 rounded-full w-4/5"></div>
                      </div>
                      <span className="text-xs text-gray-500">80%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">夜 (18:00-24:00)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-400 h-2 rounded-full w-full"></div>
                      </div>
                      <span className="text-xs text-gray-500">100%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ハッシュタグ分析 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              トップパフォーマンス タグ
            </CardTitle>
            <CardDescription>
              エンゲージメントを向上させるタグ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {growthMetrics.topPerformingTags.map((tag, index) => (
                <div key={tag} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 'bg-orange-400'
                    }`}>
                      #{index + 1}
                    </div>
                    <span className="font-medium">#{tag}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-600">
                      +{(15 - index * 3).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">エンゲージメント向上</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* コンテンツ戦略 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              戦略的改善提案
            </CardTitle>
            <CardDescription>
              データに基づく具体的なアクション項目
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-semibold text-green-700">推奨アクション</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">19:00-21:00に投稿頻度を増やす</p>
                      <p className="text-xs text-gray-500">予想効果: フォロワー増加率 +22%</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">#ChatGPT タグを戦略的に使用</p>
                      <p className="text-xs text-gray-500">予想効果: エンゲージメント +15%</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">週3回以上の定期投稿</p>
                      <p className="text-xs text-gray-500">予想効果: フォロワー継続率 +18%</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-orange-700">注意事項</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">朝の時間帯は避ける</p>
                      <p className="text-xs text-gray-500">エンゲージメント率が最も低い</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">過度なハッシュタグは逆効果</p>
                      <p className="text-xs text-gray-500">3-5個程度が最適</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">投稿間隔を空けすぎない</p>
                      <p className="text-xs text-gray-500">フォロワーの関心が低下</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 競合分析 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              競合クリエイター分析
            </CardTitle>
            <CardDescription>
              同カテゴリーとの比較
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">あなたの順位</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                  #12 / 150
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">カテゴリー平均との差</span>
                  <span className="text-sm font-semibold text-green-600">+34%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full w-3/4"></div>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-blue-800">成長ポテンシャル</p>
                <p className="text-xs text-blue-600">
                  上位10位までの到達予想: 3-4ヶ月
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* カレンダー最適化 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              投稿スケジュール最適化
            </CardTitle>
            <CardDescription>
              来週の推奨投稿スケジュール
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['月', '火', '水', '木', '金', '土', '日'].map((day, index) => (
                <div key={day} className={`flex items-center justify-between p-2 rounded ${
                  index % 2 === 0 ? 'bg-green-50' : 'bg-blue-50'
                }`}>
                  <span className="font-medium">{day}曜日</span>
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {index % 3 === 0 ? '19:00' : index % 3 === 1 ? '20:00' : '休み'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {index % 3 !== 2 ? '予想リーチ: 1.2k' : 'リフレッシュ日'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* リアルタイムAPI分析 */}
      <div className="mt-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-green-500" />
            リアルタイムAPI分析
          </h2>
          <p className="text-gray-600">
            実際のNote APIを使用して、リアルタイムでクリエイターのデータを分析します。
          </p>
        </div>
        <RealAnalytics />
      </div>

      {/* エンゲージメント最適化ツール */}
      <div className="mt-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Lightbulb className="h-6 w-6" />
            エンゲージメント最適化ツール
          </h2>
          <p className="text-gray-600">
            記事の内容を分析して、より多くの読者にリーチし、エンゲージメントを向上させるための具体的な提案を受け取れます。
          </p>
        </div>
        <EngagementOptimizer />
      </div>
    </div>
  )
} 