import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/server'
import { FileText, Users, Upload, ExternalLink } from 'lucide-react'

export default async function SubmitPage() {
  const supabase = createClient()
  
  // カテゴリー一覧を取得
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('id')

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-gray-900">データ投稿</h1>
      
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">投稿について</h2>
        <p className="text-blue-800">
          あなたのNote記事やクリエイター情報をデータベースに追加できます。
          投稿されたデータは分析に使用され、より良いインサイトの提供に役立ちます。
        </p>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              クリエイター情報投稿
            </CardTitle>
            <CardDescription>
              あなたのNoteクリエイター情報を追加
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div>
                <Label htmlFor="creator_url">Note プロフィールURL</Label>
                <div className="flex gap-2">
                  <Input 
                    id="creator_url" 
                    placeholder="https://note.com/username" 
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  NoteプロフィールのURLを入力すると、基本情報を自動取得します
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="submit_username">ユーザー名</Label>
                  <Input id="submit_username" placeholder="例: techwriter" />
                </div>
                <div>
                  <Label htmlFor="submit_display_name">表示名</Label>
                  <Input id="submit_display_name" placeholder="例: テックライター" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="submit_bio">プロフィール</Label>
                <Textarea id="submit_bio" placeholder="自己紹介文" />
              </div>
              
              <div>
                <Label htmlFor="submit_category">専門カテゴリー</Label>
                <select id="submit_category" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                  <option value="">カテゴリーを選択</option>
                  {categories?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <Button type="submit" className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                クリエイター情報を投稿
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              記事投稿
            </CardTitle>
            <CardDescription>
              あなたのNote記事をデータベースに追加
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div>
                <Label htmlFor="article_url">記事URL</Label>
                <div className="flex gap-2">
                  <Input 
                    id="article_url" 
                    placeholder="https://note.com/username/n/xxxxxx" 
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  記事URLを入力すると、記事情報を自動取得します
                </p>
              </div>
              
              <div>
                <Label htmlFor="submit_title">記事タイトル</Label>
                <Input id="submit_title" placeholder="記事のタイトル" />
              </div>
              
              <div>
                <Label htmlFor="submit_excerpt">記事概要</Label>
                <Textarea id="submit_excerpt" placeholder="記事の概要や要約" />
              </div>
              
              <div>
                <Label htmlFor="submit_tags">タグ（カンマ区切り）</Label>
                <Input id="submit_tags" placeholder="AI,ChatGPT,テクノロジー" />
              </div>
              
              <div>
                <Label htmlFor="submit_published">公開日</Label>
                <Input id="submit_published" type="date" />
              </div>
              
              <Button type="submit" className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                記事を投稿
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>一括投稿</CardTitle>
          <CardDescription>
            複数の記事やクリエイター情報を一度に投稿
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulk_urls">URL一覧（1行に1つ）</Label>
              <Textarea 
                id="bulk_urls" 
                placeholder={`https://note.com/username/n/xxxxxx1
https://note.com/username/n/xxxxxx2
https://note.com/username/n/xxxxxx3`}
                rows={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                記事URLまたはクリエイターURLを改行区切りで入力
              </p>
            </div>
            
            <Button type="submit" className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              一括投稿
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>投稿履歴</CardTitle>
          <CardDescription>あなたが投稿したデータの一覧</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="mx-auto h-12 w-12 mb-4 text-gray-300" />
            <p>まだ投稿データがありません</p>
            <p className="text-sm">上記のフォームから投稿してください</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 