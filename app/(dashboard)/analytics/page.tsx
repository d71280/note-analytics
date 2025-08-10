'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Users, 
  MessageSquare, 
  Heart,
  Eye
} from 'lucide-react'

interface AnalyticsData {
  totalPosts: number
  totalImpressions: number
  totalEngagements: number
  averageEngagementRate: number
  bestPerformingPost?: {
    content: string
    engagements: number
    platform: string
    posted_at: string
  }
  postsByPlatform: {
    platform: string
    count: number
    impressions: number
    engagements: number
  }[]
  engagementTrend: {
    date: string
    impressions: number
    engagements: number
    posts: number
  }[]
  postingTimeAnalysis: {
    hour: number
    averageEngagement: number
    posts: number
  }[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // モックデータ（実際のAPIが実装されるまで）
      const mockData: AnalyticsData = {
        totalPosts: 147,
        totalImpressions: 45230,
        totalEngagements: 3421,
        averageEngagementRate: 7.56,
        bestPerformingPost: {
          content: 'AIの最新トレンドについて：生成AIがビジネスを変革する5つの方法',
          engagements: 234,
          platform: 'x',
          posted_at: '2024-01-15T10:00:00Z'
        },
        postsByPlatform: [
          { platform: 'X', count: 89, impressions: 32100, engagements: 2456 },
          { platform: 'Note', count: 34, impressions: 8900, engagements: 678 },
          { platform: 'WordPress', count: 24, impressions: 4230, engagements: 287 }
        ],
        engagementTrend: [
          { date: '1/1', impressions: 1200, engagements: 89, posts: 5 },
          { date: '1/2', impressions: 1450, engagements: 112, posts: 6 },
          { date: '1/3', impressions: 1380, engagements: 98, posts: 5 },
          { date: '1/4', impressions: 1650, engagements: 134, posts: 7 },
          { date: '1/5', impressions: 1890, engagements: 156, posts: 8 },
          { date: '1/6', impressions: 1420, engagements: 103, posts: 5 },
          { date: '1/7', impressions: 1580, engagements: 121, posts: 6 }
        ],
        postingTimeAnalysis: [
          { hour: 6, averageEngagement: 45, posts: 8 },
          { hour: 9, averageEngagement: 89, posts: 23 },
          { hour: 12, averageEngagement: 112, posts: 31 },
          { hour: 15, averageEngagement: 98, posts: 27 },
          { hour: 18, averageEngagement: 134, posts: 35 },
          { hour: 21, averageEngagement: 76, posts: 23 }
        ]
      }
      
      setAnalyticsData(mockData)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">読み込み中...</div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">データがありません</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Activity className="h-8 w-8" />
          投稿分析ダッシュボード
        </h1>
        <p className="text-gray-600 mt-2">
          投稿のパフォーマンスを分析し、改善点を見つけましょう
        </p>
      </div>

      {/* 期間選択 */}
      <div className="mb-6">
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as '7d' | '30d' | '90d')}>
          <TabsList>
            <TabsTrigger value="7d">過去7日間</TabsTrigger>
            <TabsTrigger value="30d">過去30日間</TabsTrigger>
            <TabsTrigger value="90d">過去90日間</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              総投稿数
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalPosts}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" /> 前期比 +12%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              インプレッション
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.totalImpressions)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" /> 前期比 +23%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              エンゲージメント
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.totalEngagements)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" /> 前期比 +18%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              平均エンゲージメント率
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.averageEngagementRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="inline h-3 w-3 text-red-500" /> 前期比 -2%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* グラフセクション */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* エンゲージメントトレンド */}
        <Card>
          <CardHeader>
            <CardTitle>エンゲージメントトレンド</CardTitle>
            <CardDescription>日別のインプレッションとエンゲージメント</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.engagementTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="impressions" 
                  stroke="#8884d8" 
                  name="インプレッション"
                />
                <Line 
                  type="monotone" 
                  dataKey="engagements" 
                  stroke="#82ca9d" 
                  name="エンゲージメント"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* プラットフォーム別パフォーマンス */}
        <Card>
          <CardHeader>
            <CardTitle>プラットフォーム別パフォーマンス</CardTitle>
            <CardDescription>各プラットフォームの投稿数とエンゲージメント</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.postsByPlatform}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="platform" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="投稿数" />
                <Bar dataKey="engagements" fill="#82ca9d" name="エンゲージメント" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 投稿時間分析 */}
        <Card>
          <CardHeader>
            <CardTitle>最適な投稿時間</CardTitle>
            <CardDescription>時間帯別の平均エンゲージメント</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.postingTimeAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tickFormatter={(h) => `${h}時`} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="averageEngagement" fill="#ffc658" name="平均エンゲージメント" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* プラットフォーム分布 */}
        <Card>
          <CardHeader>
            <CardTitle>投稿プラットフォーム分布</CardTitle>
            <CardDescription>プラットフォーム別の投稿割合</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.postsByPlatform}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ platform, count }) => `${platform}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analyticsData.postsByPlatform.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ベストパフォーマンス投稿 */}
      {analyticsData.bestPerformingPost && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              最も反響があった投稿
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-700">{analyticsData.bestPerformingPost.content}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {analyticsData.bestPerformingPost.engagements} エンゲージメント
                </span>
                <span>{analyticsData.bestPerformingPost.platform.toUpperCase()}</span>
                <span>{new Date(analyticsData.bestPerformingPost.posted_at).toLocaleDateString('ja-JP')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}