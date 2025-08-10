'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Copy, Globe, FileText, Twitter, ArrowLeft, Save, Trash2 } from 'lucide-react'

interface ContentDetail {
  id: string
  content: string
  platform: 'x' | 'note' | 'wordpress'
  metadata?: Record<string, unknown>
  status: string
  created_at: string
  scheduled_for?: string
}

const platformIcons = {
  x: Twitter,
  note: FileText,
  wordpress: Globe
}

const platformColors = {
  x: 'bg-blue-500',
  note: 'bg-green-500',
  wordpress: 'bg-purple-500'
}

export default function ContentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [content, setContent] = useState<ContentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editedContent, setEditedContent] = useState('')
  const [editedPlatform, setEditedPlatform] = useState<'x' | 'note' | 'wordpress'>('x')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchContent()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const fetchContent = async () => {
    try {
      const response = await fetch(`/api/gpts/contents/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setContent(data)
        setEditedContent(data.content)
        setEditedPlatform(data.platform)
      }
    } catch (error) {
      console.error('Failed to fetch content:', error)
      setMessage({ type: 'error', text: 'コンテンツの取得に失敗しました' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setLoading(false)
    }
  }

  const saveChanges = async () => {
    try {
      const response = await fetch(`/api/gpts/contents/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: editedContent,
          platform: editedPlatform
        })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: '変更を保存しました' })
        setTimeout(() => setMessage(null), 3000)
        fetchContent()
      }
    } catch (error) {
      console.error('Failed to save changes:', error)
      setMessage({ type: 'error', text: '保存に失敗しました' })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const deleteContent = async () => {
    if (!confirm('このコンテンツを削除しますか？')) return

    try {
      const response = await fetch(`/api/gpts/contents/${params.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'コンテンツを削除しました' })
        setTimeout(() => {
          router.push('/gpts/contents')
        }, 1000)
      }
    } catch (error) {
      console.error('Failed to delete content:', error)
      setMessage({ type: 'error', text: '削除に失敗しました' })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(editedContent)
    setMessage({ type: 'success', text: 'クリップボードにコピーしました' })
    setTimeout(() => setMessage(null), 2000)
  }

  if (loading) {
    return <div className="container mx-auto py-8">読み込み中...</div>
  }

  if (!content) {
    return <div className="container mx-auto py-8">コンテンツが見つかりません</div>
  }

  const Icon = platformIcons[editedPlatform]
  const colorClass = platformColors[editedPlatform]

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}
      <Button
        variant="ghost"
        onClick={() => router.push('/gpts/contents')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        一覧に戻る
      </Button>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${colorClass} text-white`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle>コンテンツ詳細</CardTitle>
                <CardDescription>
                  作成日: {new Date(content.created_at).toLocaleString('ja-JP')}
                </CardDescription>
              </div>
            </div>
            <Badge variant={
              content.status === 'published' ? 'default' :
              content.status === 'scheduled' ? 'secondary' :
              'outline'
            }>
              {content.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-base font-semibold mb-2 block">プラットフォーム</Label>
            <Select value={editedPlatform} onValueChange={(value) => setEditedPlatform(value as 'x' | 'note' | 'wordpress')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="x">X (Twitter)</SelectItem>
                <SelectItem value="note">note</SelectItem>
                <SelectItem value="wordpress">WordPress</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="text-base font-semibold">コンテンツ内容</Label>
              <div className="text-sm text-gray-500">
                {editedContent.length}文字
              </div>
            </div>
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
              placeholder="コンテンツを入力..."
            />
          </div>

          {content.metadata && Object.keys(content.metadata).length > 0 && (
            <div>
              <Label className="text-base font-semibold mb-2 block">メタデータ</Label>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(content.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={copyToClipboard}
              >
                <Copy className="h-4 w-4 mr-2" />
                コピー
              </Button>
              <Button
                variant="destructive"
                onClick={deleteContent}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                削除
              </Button>
            </div>
            <Button onClick={saveChanges}>
              <Save className="h-4 w-4 mr-2" />
              変更を保存
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}