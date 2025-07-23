import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Users, TrendingUp, Star } from 'lucide-react'

export default function CreatorsPage() {
  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-gray-900">クリエイター検索</h1>
      
      <div className="mb-8">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="クリエイター名やキーワードで検索..."
              className="w-full"
            />
          </div>
          <Button>
            <Search className="mr-2 h-4 w-4" />
            検索
          </Button>
        </div>
      </div>

      <div className="mb-6 flex gap-4">
        <select className="rounded-md border border-gray-300 px-4 py-2">
          <option>すべてのカテゴリー</option>
          <option>ビジネス</option>
          <option>テクノロジー</option>
          <option>ライフスタイル</option>
          <option>エンタメ</option>
          <option>クリエイティブ</option>
        </select>
        <select className="rounded-md border border-gray-300 px-4 py-2">
          <option>フォロワー数順</option>
          <option>成長率順</option>
          <option>エンゲージメント率順</option>
          <option>更新頻度順</option>
        </select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* サンプルクリエイターカード */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gray-300"></div>
                <div>
                  <CardTitle className="text-lg">サンプルクリエイター</CardTitle>
                  <CardDescription>@sample_creator</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Star className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">フォロワー</span>
                <span className="font-semibold">10,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">記事数</span>
                <span className="font-semibold">150</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">平均スキ数</span>
                <span className="font-semibold">250</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">成長率</span>
                <div className="flex items-center text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="font-semibold">+15%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gray-300"></div>
                <div>
                  <CardTitle className="text-lg">テックライター</CardTitle>
                  <CardDescription>@tech_writer</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Star className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">フォロワー</span>
                <span className="font-semibold">25,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">記事数</span>
                <span className="font-semibold">320</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">平均スキ数</span>
                <span className="font-semibold">480</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">成長率</span>
                <div className="flex items-center text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="font-semibold">+22%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gray-300"></div>
                <div>
                  <CardTitle className="text-lg">ライフスタイル</CardTitle>
                  <CardDescription>@lifestyle_note</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Star className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">フォロワー</span>
                <span className="font-semibold">8,500</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">記事数</span>
                <span className="font-semibold">85</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">平均スキ数</span>
                <span className="font-semibold">180</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">成長率</span>
                <div className="flex items-center text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="font-semibold">+8%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-600">
          より多くのクリエイターを検索するには、検索条件を指定してください。
        </p>
      </div>
    </div>
  )
}