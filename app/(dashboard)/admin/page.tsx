import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/server'
import { FileText, Users, Plus } from 'lucide-react'

export default async function AdminPage() {
  const supabase = createClient()
  
  // カテゴリー一覧を取得
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('id')

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-gray-900">データ管理</h1>
      
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              クリエイター追加
            </CardTitle>
            <CardDescription>Noteクリエイターの情報を手動で追加</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="note_id">Note ID</Label>
                  <Input id="note_id" placeholder="例: creator001" />
                </div>
                <div>
                  <Label htmlFor="username">ユーザー名</Label>
                  <Input id="username" placeholder="例: techwriter" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="display_name">表示名</Label>
                <Input id="display_name" placeholder="例: テックライター" />
              </div>
              
              <div>
                <Label htmlFor="bio">プロフィール</Label>
                <Textarea id="bio" placeholder="クリエイターの紹介文" />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="follower_count">フォロワー数</Label>
                  <Input id="follower_count" type="number" placeholder="1250" />
                </div>
                <div>
                  <Label htmlFor="following_count">フォロー数</Label>
                  <Input id="following_count" type="number" placeholder="300" />
                </div>
                <div>
                  <Label htmlFor="total_articles">記事数</Label>
                  <Input id="total_articles" type="number" placeholder="45" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="category_id">カテゴリー</Label>
                <select id="category_id" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                  <option value="">カテゴリーを選択</option>
                  {categories?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <Button type="submit" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                クリエイター追加
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              記事追加
            </CardTitle>
            <CardDescription>記事情報を手動で追加</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div>
                <Label htmlFor="article_note_id">記事ID</Label>
                <Input id="article_note_id" placeholder="例: article001" />
              </div>
              
              <div>
                <Label htmlFor="article_title">記事タイトル</Label>
                <Input id="article_title" placeholder="記事のタイトル" />
              </div>
              
              <div>
                <Label htmlFor="article_excerpt">記事概要</Label>
                <Textarea id="article_excerpt" placeholder="記事の概要や抜粋" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="like_count">いいね数</Label>
                  <Input id="like_count" type="number" placeholder="1250" />
                </div>
                <div>
                  <Label htmlFor="comment_count">コメント数</Label>
                  <Input id="comment_count" type="number" placeholder="45" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="tags">タグ（カンマ区切り）</Label>
                <Input id="tags" placeholder="AI,ChatGPT,テクノロジー" />
              </div>
              
              <div>
                <Label htmlFor="published_at">公開日時</Label>
                <Input id="published_at" type="datetime-local" />
              </div>
              
              <Button type="submit" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                記事追加
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CSV/Excel インポート機能</CardTitle>
          <CardDescription>一括でデータを取り込む場合はこちら</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center w-full">
            <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FileText className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">クリックして</span> ファイルをアップロード
                </p>
                <p className="text-xs text-gray-500">CSV または Excel ファイル (最大10MB)</p>
              </div>
              <input id="file-upload" type="file" className="hidden" accept=".csv,.xlsx,.xls" />
            </label>
          </div>
          
          <div className="mt-4 space-y-2">
            <h4 className="font-medium">CSVフォーマット例:</h4>
            <div className="bg-gray-100 p-3 rounded text-xs font-mono">
              <div>クリエイター: note_id,username,display_name,bio,follower_count,category_id</div>
              <div>記事: note_article_id,title,excerpt,like_count,comment_count,tags</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 