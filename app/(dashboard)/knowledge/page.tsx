'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Brain, Plus, Edit, Trash2, Save, X as XIcon, FileText, Loader2, Upload } from 'lucide-react'
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
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // PDFの場合は専用のAPIを使用
      const endpoint = file.type === 'application/pdf' 
        ? '/api/knowledge/process-pdf'
        : '/api/knowledge/upload'

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        await fetchKnowledgeItems()
        alert(`ファイル「${file.name}」を知識ベースに追加しました`)
      } else {
        const error = await response.json()
        alert(`アップロードに失敗しました: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('ファイルのアップロードに失敗しました')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
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
                  placeholder="知識の内容を入力..."
                  rows={8}
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
        
        <div className="relative">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
            accept=".pdf,.txt,.md,.doc,.docx"
            disabled={isUploading}
          />
          <Button
            onClick={() => document.getElementById('file-upload')?.click()}
            variant="outline"
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                アップロード中...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                ファイルアップロード
              </>
            )}
          </Button>
        </div>
      </div>
      </div>

      {knowledgeItems.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600">まだ知識が登録されていません</p>
            <p className="text-sm text-gray-500 mt-2">
              「新規追加」ボタンから知識を追加してください
            </p>
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
    </div>
  )
}