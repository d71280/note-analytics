'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Copy, Globe, FileText, Twitter, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface GPTsContent {
  id: string
  content: string
  platform: 'x' | 'note' | 'wordpress'
  metadata: {
    title?: string
    tags?: string[]
    category?: string
    generatedBy?: string
    model?: string
    prompt?: string
  }
  status: 'draft' | 'scheduled' | 'published'
  received_at: string
  scheduled_for?: string
  created_at: string
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

export default function GPTsContentsPage() {
  const [contents, setContents] = useState<GPTsContent[]>([])
  const [loading, setLoading] = useState(true)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)

  useEffect(() => {
    fetchContents()
    fetchApiKey()
  }, [])

  const fetchContents = async () => {
    try {
      const response = await fetch('/api/gpts/contents')
      if (response.ok) {
        const data = await response.json()
        setContents(data.contents || [])
      }
    } catch (error) {
      console.error('Failed to fetch contents:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchApiKey = async () => {
    try {
      const response = await fetch('/api/gpts/api-key')
      if (response.ok) {
        const data = await response.json()
        setApiKey(data.apiKey || '')
      }
    } catch (error) {
      console.error('Failed to fetch API key:', error)
    }
  }

  const scheduleContent = async (contentId: string) => {
    if (!scheduleDate || !scheduleTime) {
      alert('日付と時刻を選択してください')
      return
    }

    const scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`).toISOString()

    try {
      const response = await fetch(`/api/gpts/contents/${contentId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledFor })
      })

      if (response.ok) {
        alert('スケジュール設定が完了しました')
        fetchContents()
      }
    } catch (error) {
      console.error('Failed to schedule content:', error)
      alert('スケジュール設定に失敗しました')
    }
  }

  const deleteContent = async (contentId: string) => {
    if (!confirm('このコンテンツを削除しますか？')) return

    try {
      const response = await fetch(`/api/gpts/contents/${contentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchContents()
      }
    } catch (error) {
      console.error('Failed to delete content:', error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('クリップボードにコピーしました')
  }

  const generateNewApiKey = async () => {
    try {
      const response = await fetch('/api/gpts/api-key', {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setApiKey(data.apiKey)
        alert('新しいAPIキーを生成しました')
      }
    } catch (error) {
      console.error('Failed to generate API key:', error)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">GPTs連携コンテンツ</h1>
        <p className="text-gray-600 mt-2">
          GPTsから受信したコンテンツを管理し、スケジュール配信を設定します
        </p>
      </div>

      {/* API設定セクション */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>GPTs連携設定</CardTitle>
          <CardDescription>
            GPTsのActionsに設定するAPIエンドポイントとキー
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>APIエンドポイント</Label>
            <div className="flex gap-2 mt-2">
              <Input 
                readOnly 
                value={typeof window !== 'undefined' ? `${window.location.origin}/api/gpts/receive-content` : '/api/gpts/receive-content'}
                className="flex-1"
              />
              <Button 
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(typeof window !== 'undefined' ? `${window.location.origin}/api/gpts/receive-content` : '/api/gpts/receive-content')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>APIキー</Label>
            <div className="flex gap-2 mt-2">
              <Input 
                readOnly 
                type={showApiKey ? 'text' : 'password'}
                value={apiKey || 'APIキーが設定されていません'}
                className="flex-1"
              />
              <Button 
                size="sm"
                variant="outline"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? '隠す' : '表示'}
              </Button>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(apiKey)}
                disabled={!apiKey}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button 
                size="sm"
                onClick={generateNewApiKey}
              >
                新規生成
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">
              📝 GPTsの設定方法：
            </p>
            <ol className="list-decimal list-inside text-sm text-gray-600 mt-2 space-y-1">
              <li>GPTsの「Configure」→「Add actions」を選択</li>
              <li>上記のAPIエンドポイントをServer URLに設定</li>
              <li>Authentication TypeをAPI Keyに設定</li>
              <li>Header nameを「x-api-key」に設定</li>
              <li>API Keyに上記のキーを入力</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* コンテンツ一覧 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full text-center py-8">
            読み込み中...
          </div>
        ) : contents.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">まだコンテンツがありません</p>
            <p className="text-sm text-gray-400 mt-2">
              GPTsから生成されたコンテンツがここに表示されます
            </p>
          </div>
        ) : (
          contents.map((content) => {
            const Icon = platformIcons[content.platform]
            const colorClass = platformColors[content.platform]
            
            return (
              <Card key={content.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${colorClass} text-white`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {content.metadata.title || 'Untitled'}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {new Date(content.received_at).toLocaleString('ja-JP')}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={
                      content.status === 'published' ? 'default' :
                      content.status === 'scheduled' ? 'secondary' :
                      'outline'
                    }>
                      {content.status === 'published' ? '公開済み' :
                       content.status === 'scheduled' ? 'スケジュール済み' :
                       '下書き'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 line-clamp-3 mb-4">
                    {content.content}
                  </p>
                  
                  {content.metadata.tags && content.metadata.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {content.metadata.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      {content.content.length}文字 | {content.metadata.model || 'Unknown model'}
                    </div>
                    <div className="flex gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            disabled={content.status !== 'draft'}
                          >
                            <Calendar className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>スケジュール設定</DialogTitle>
                            <DialogDescription>
                              このコンテンツの配信日時を設定します
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div>
                              <Label>配信日</Label>
                              <Input 
                                type="date" 
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                                className="mt-2"
                              />
                            </div>
                            <div>
                              <Label>配信時刻</Label>
                              <Input 
                                type="time" 
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                                className="mt-2"
                              />
                            </div>
                            <Button 
                              onClick={() => scheduleContent(content.id)}
                              className="w-full"
                            >
                              スケジュール設定
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(content.content)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => deleteContent(content.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}