'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Copy, Globe, FileText, Twitter, Trash2, CheckCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface GPTsContent {
  id: string
  content: string
  platform: 'x' | 'note' | 'wordpress'
  metadata?: {
    title?: string
    tags?: string[]
    category?: string
    generatedBy?: string
    model?: string
    prompt?: string
    source?: string
    receivedAt?: string
  }
  status: 'draft' | 'scheduled' | 'published' | 'pending'
  received_at?: string
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
  const [copySuccess, setCopySuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchContents()
    fetchApiKey()
  }, [])

  const fetchContents = async () => {
    try {
      const response = await fetch('/api/gpts/list')
      if (response.ok) {
        const data = await response.json()
        setContents(data.posts || [])
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

  const copyToClipboard = (text: string, label?: string) => {
    navigator.clipboard.writeText(text)
    setCopySuccess(label || 'copied')
    setTimeout(() => setCopySuccess(null), 2000)
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
      alert('APIキーの生成に失敗しました')
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
            GPTsから受信したコンテンツを管理し、スケジュール配信を設定します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-2">GPTs連携設定</h3>
            <p className="text-sm text-gray-600">
              GPTsのActionsに設定するAPIエンドポイントとキー
            </p>
          </div>

          <div>
            <Label className="text-base font-semibold mb-2 block">APIエンドポイント</Label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input 
                  readOnly 
                  value={typeof window !== 'undefined' ? `${window.location.origin}/api/gpts/receive-content` : 'https://note-analytics-o5pl33kmd-daiki-akiyama-9051s-projects.vercel.app/api/gpts/receive-content'}
                  className="pr-10 font-mono text-sm bg-gray-50"
                />
                <Button 
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => copyToClipboard(typeof window !== 'undefined' ? `${window.location.origin}/api/gpts/receive-content` : 'https://note-analytics-o5pl33kmd-daiki-akiyama-9051s-projects.vercel.app/api/gpts/receive-content', 'endpoint')}
                >
                  {copySuccess === 'endpoint' ? (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-base font-semibold mb-2 block">APIキー</Label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input 
                  readOnly 
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey || '••••••••••••••••'}
                  placeholder="APIキーが設定されていません"
                  className="pr-20 font-mono bg-gray-50"
                />
                <Button 
                  size="sm"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-xs"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? '隠す' : '表示'}
                </Button>
              </div>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(apiKey, 'apikey')}
                disabled={!apiKey}
              >
                {copySuccess === 'apikey' ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                    コピー済
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    コピー
                  </>
                )}
              </Button>
              <Button 
                size="sm"
                onClick={generateNewApiKey}
              >
                新規生成
              </Button>
            </div>
            {apiKey && (
              <p className="text-xs text-gray-500 mt-1">
                ✅ APIキーが設定されています
              </p>
            )}
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">🔧 GPTsの設定方法：</h3>
            <ol className="space-y-2">
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">1</span>
                <div>
                  <p className="text-sm font-medium">GPTsの「Configure」→ 「Add actions」を選択</p>
                </div>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">2</span>
                <div>
                  <p className="text-sm font-medium">上記のAPIエンドポイントをServer URLに設定</p>
                </div>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">3</span>
                <div>
                  <p className="text-sm font-medium">Authentication TypeをAPI Keyに設定</p>
                </div>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">4</span>
                <div>
                  <p className="text-sm font-medium">Header nameを「x-api-key」に設定</p>
                </div>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">5</span>
                <div>
                  <p className="text-sm font-medium">API Keyに上記のキーを入力</p>
                </div>
              </li>
            </ol>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">
                ⚠️ まだコンテンツがありません。GPTsから生成されたコンテンツがここに表示されます。
              </p>
            </div>
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
                          {content.metadata?.title || `${content.platform.toUpperCase()}投稿`}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {new Date(content.created_at || content.received_at || Date.now()).toLocaleString('ja-JP')}
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
                  <div className="mb-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words max-h-32 overflow-y-auto border rounded p-2 bg-gray-50">
                      {content.content}
                    </p>
                  </div>
                  
                  {content.metadata?.tags && content.metadata.tags.length > 0 && (
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
                      {content.content.length}文字 | {content.metadata?.model || 'GPTs'}
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => copyToClipboard(content.content, content.id)}
                      >
                        {copySuccess === content.id ? (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
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
                        onClick={() => copyToClipboard(content.content, `content-${content.id}`)}
                      >
                        {copySuccess === `content-${content.id}` ? (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
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