'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  const [copySuccess, setCopySuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchContents()
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">GPTs連携コンテンツ</h1>
        <p className="text-gray-600 mt-2">
          GPTsから受信したコンテンツを管理し、スケジュール配信を設定します
        </p>
      </div>


      {/* コンテンツ一覧 */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            読み込み中...
          </div>
        ) : contents.length === 0 ? (
          <div className="text-center py-8">
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
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* プラットフォームアイコン */}
                    <div className={`p-3 rounded-lg ${colorClass} text-white flex-shrink-0`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    
                    {/* コンテンツ本文 */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {content.metadata?.title || `${content.platform.toUpperCase()}投稿`}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {new Date(content.created_at || content.received_at || Date.now()).toLocaleString('ja-JP')}
                          </p>
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
                      
                      <p className="text-gray-700 mb-3 line-clamp-3">
                        {content.content}
                      </p>
                      
                      {content.metadata?.tags && content.metadata.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {content.metadata.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          {content.content.length}文字 | {content.metadata?.model || 'GPTs'}
                        </div>
                        
                        {/* アクションボタン */}
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => copyToClipboard(content.content, content.id)}
                          >
                            {copySuccess === content.id ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                disabled={content.status !== 'draft'}
                              >
                                <Calendar className="h-4 w-4 mr-1" />
                                スケジュール
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
                            onClick={() => deleteContent(content.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
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