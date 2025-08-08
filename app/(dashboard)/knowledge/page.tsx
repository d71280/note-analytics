'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Brain, Plus, Edit, Trash2, Save, X as XIcon, FileText, Loader2, Database, Sparkles } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface KnowledgeItem {
  id?: string
  title: string
  content: string
  content_type: string
  tags?: string[]
  created_at?: string
  updated_at?: string
}

export default function KnowledgePage() {
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState<KnowledgeItem>({
    title: '',
    content: '',
    content_type: 'note',
    tags: []
  })
  const [tagInput, setTagInput] = useState('')
  const [isSeedingData, setIsSeedingData] = useState(false)

  useEffect(() => {
    fetchKnowledgeItems()
  }, [])

  const fetchKnowledgeItems = async () => {
    try {
      const response = await fetch('/api/knowledge/list')
      if (response.ok) {
        const data = await response.json()
        setKnowledgeItems(data.items || [])
      }
    } catch (error) {
      console.error('Failed to fetch knowledge items:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const endpoint = editingItem ? '/api/knowledge/update' : '/api/knowledge/create'
      const method = editingItem ? 'PUT' : 'POST'
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id: editingItem?.id
        })
      })

      if (response.ok) {
        await fetchKnowledgeItems()
        setIsDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error('Failed to save knowledge item:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この知識を削除してもよろしいですか？')) return

    try {
      const response = await fetch('/api/knowledge/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      if (response.ok) {
        await fetchKnowledgeItems()
      }
    } catch (error) {
      console.error('Failed to delete knowledge item:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      content_type: 'note',
      tags: []
    })
    setTagInput('')
    setEditingItem(null)
  }

  const openEditDialog = (item: KnowledgeItem) => {
    setEditingItem(item)
    setFormData(item)
    setTagInput(item.tags?.join(', ') || '')
    setIsDialogOpen(true)
  }

  const openCreateDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleTagInputChange = (value: string) => {
    setTagInput(value)
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag)
    setFormData({ ...formData, tags })
  }

  const seedSampleData = async () => {
    if (!confirm('サンプルデータを追加しますか？既存のデータがある場合は追加されません。')) return

    setIsSeedingData(true)
    try {
      const response = await fetch('/api/knowledge/seed-sample-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()
      
      if (data.success) {
        alert(data.message)
        await fetchKnowledgeItems()
      } else {
        alert(data.message || 'サンプルデータの追加に失敗しました')
      }
    } catch (error) {
      console.error('Failed to seed sample data:', error)
      alert('サンプルデータの追加中にエラーが発生しました')
    } finally {
      setIsSeedingData(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8" />
            知識ベース管理
          </h1>
          <p className="text-gray-600 mt-2">
            コンテンツ生成に使用する知識を管理します
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={seedSampleData}
            disabled={isSeedingData}
            className="flex items-center gap-2"
          >
            {isSeedingData ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            {isSeedingData ? '追加中...' : 'サンプルデータ追加'}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                新規追加
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? '知識を編集' : '新しい知識を追加'}
                </DialogTitle>
                <DialogDescription>
                  コンテンツ生成に使用する知識情報を入力してください
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="title">タイトル</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="知識のタイトル"
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="content_type">コンテンツタイプ</Label>
                  <Select
                    value={formData.content_type}
                    onValueChange={(value) => setFormData({ ...formData, content_type: value })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="note">Note記事</SelectItem>
                      <SelectItem value="blog">ブログ記事</SelectItem>
                      <SelectItem value="tweet">ツイート</SelectItem>
                      <SelectItem value="idea">アイデア</SelectItem>
                      <SelectItem value="document">ドキュメント</SelectItem>
                      <SelectItem value="guidebook">ガイドブック</SelectItem>
                      <SelectItem value="strategy">戦略</SelectItem>
                      <SelectItem value="research">リサーチ</SelectItem>
                      <SelectItem value="analysis">分析</SelectItem>
                      <SelectItem value="other">その他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="content">内容</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="知識の内容を入力...\n\n例：\n- 記事の本文\n- 参考資料\n- アイデアメモ\n- よく使うフレーズ\n- 専門知識"
                    rows={10}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="tags">タグ（カンマ区切り）</Label>
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => handleTagInputChange(e.target.value)}
                    placeholder="例: AI, 技術, トレンド"
                    className="mt-2"
                  />
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false)
                      resetForm()
                    }}
                  >
                    <XIcon className="mr-2 h-4 w-4" />
                    キャンセル
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    保存
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {knowledgeItems.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600">まだ知識が登録されていません</p>
            <p className="text-sm text-gray-500 mt-2 mb-4">
              高度なコンテンツ生成を開始するには、まず知識ベースにデータを追加してください
            </p>
            <div className="flex gap-2 justify-center">
              <Button 
                variant="outline" 
                onClick={seedSampleData}
                disabled={isSeedingData}
                className="flex items-center gap-2"
              >
                {isSeedingData ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Database className="h-4 w-4" />
                )}
                {isSeedingData ? '追加中...' : 'サンプルデータを追加'}
              </Button>
              <Button onClick={openCreateDialog} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                手動で追加
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {knowledgeItems.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <FileText className="h-4 w-4" />
                      {item.content_type}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => item.id && handleDelete(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {item.content}
                </p>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {item.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {item.created_at && (
                  <p className="text-xs text-gray-500 mt-3">
                    作成日: {new Date(item.created_at).toLocaleDateString('ja-JP')}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {knowledgeItems.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              知識ベース活用状況
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{knowledgeItems.length}</div>
                <div className="text-sm text-blue-800">登録済み知識</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {knowledgeItems.filter(item => item.content_type === 'note').length}
                </div>
                <div className="text-sm text-green-800">Note関連</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {knowledgeItems.filter(item => item.content_type === 'strategy').length}
                </div>
                <div className="text-sm text-purple-800">戦略・分析</div>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">利用可能な機能</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• スタイル指定（専門的、カジュアル、教育的、エンターテイメント）</li>
                  <li>• トーン調整（フォーマル、フレンドリー、権威的、会話的）</li>
                  <li>• コンテンツタイプ選択（要約、分析、チュートリアル、意見、ニュース）</li>
                  <li>• ターゲットオーディエンス指定</li>
                  <li>• ハッシュタグ自動生成（X用）</li>
                  <li>• 知識ベース活用状況の可視化</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">対応プラットフォーム</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• X (Twitter) - 280文字以内</li>
                  <li>• Note - 2000文字以内</li>
                  <li>• WordPress - 1000文字以内</li>
                  <li>• 記事 - カスタム文字数</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2">🚀 知識ベース活用のコツ</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• 具体的なキーワードを含むプロンプトを使用すると、より関連性の高い知識が活用されます</li>
                <li>• 「脳内OS」「AI活用」「マーケティング」などのタグが付いた知識が豊富にあります</li>
                <li>• 高度な生成設定を有効にすると、より詳細な知識ベースの活用が可能です</li>
                <li>• 生成されたコンテンツの詳細で、使用された知識の詳細を確認できます</li>
              </ul>
            </div>
            
            <div className="mt-4">
              <Button 
                onClick={() => window.location.href = '/x-search'}
                className="flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                コンテンツ生成を開始
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}