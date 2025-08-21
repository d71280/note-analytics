'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Send, Globe, FileText, Twitter, Bot, CheckCircle, AlertCircle, Trash2 } from 'lucide-react'
// import { Tabs } from '@/components/ui/tabs' // 将来の実装用
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface GPTsPost {
  id: string
  content: string
  platform: 'x' | 'note' | 'wordpress'
  status: 'draft' | 'pending' | 'published' | 'failed'
  scheduled_for: string | null
  created_at: string
  metadata: {
    source: string
    generatedBy: string
    model: string
    prompt?: string
    receivedAt: string
    needsScheduling?: boolean
  }
}

const platformConfig = {
  x: {
    name: 'X (Twitter)',
    icon: Twitter,
    color: 'bg-blue-500',
    maxLength: 280
  },
  note: {
    name: 'Note',
    icon: FileText,
    color: 'bg-green-500',
    maxLength: 3000
  },
  wordpress: {
    name: 'WordPress',
    icon: Globe,
    color: 'bg-purple-500',
    maxLength: 5000
  }
}

export default function GPTsSchedulePage() {
  const [posts, setPosts] = useState<GPTsPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'x' | 'note' | 'wordpress'>('all')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'draft' | 'pending'>('all')

  useEffect(() => {
    fetchPosts()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlatform, selectedStatus])

  const fetchPosts = async () => {
    try {
      let url = '/api/gpts/contents'
      const params = []
      if (selectedPlatform !== 'all') {
        params.push(`platform=${selectedPlatform}`)
      }
      if (selectedStatus !== 'all') {
        params.push(`status=${selectedStatus}`)
      }
      if (params.length > 0) {
        url += '?' + params.join('&')
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setPosts(data.contents || [])
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const schedulePost = async (postId: string, scheduledFor: string | null) => {
    try {
      console.log('Scheduling content:', { postId, scheduledFor })
      
      const response = await fetch('/api/gpts-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'schedule',
          id: postId,
          data: {
            scheduled_for: scheduledFor,
            status: scheduledFor ? 'pending' : 'draft'  // スケジュール解除時はdraftに戻す
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Schedule success:', result)
        fetchPosts()
      } else {
        let errorMessage = `Status: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
          console.error('Failed to parse error response:', errorData)
        } catch (e) {
          console.error('Failed to parse error response:', e)
        }
        console.error('Failed to schedule content:', postId, errorMessage)
        alert(`スケジュール設定に失敗しました: ${errorMessage}`)
      }
    } catch (error) {
      console.error('Failed to schedule post:', error)
      alert('エラーが発生しました。もう一度お試しください。')
    }
  }

  const publishNow = async (postId: string) => {
    if (!confirm('今すぐ投稿しますか？')) return

    try {
      const response = await fetch('/api/gpts-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'publish',
          id: postId
        })
      })

      if (response.ok) {
        alert('投稿しました')
        fetchPosts()
      }
    } catch (error) {
      console.error('Failed to publish post:', error)
      alert('投稿に失敗しました')
    }
  }

  const deletePost = async (postId: string) => {
    if (!confirm('この投稿を削除しますか？')) return

    try {
      const response = await fetch('/api/gpts-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'delete',
          id: postId
        })
      })

      if (response.ok) {
        console.log('Successfully deleted post:', postId)
        fetchPosts()
      } else {
        const error = await response.text()
        console.error('Failed to delete post:', error)
        alert('削除に失敗しました')
      }
    } catch (error) {
      console.error('Failed to delete post:', error)
      alert('削除中にエラーが発生しました')
    }
  }

  // タイムスロット（将来の実装用）
  // const timeSlots = [
  //   { value: '08:00', label: '朝 8:00' },
  //   { value: '10:00', label: '午前 10:00' },
  //   { value: '12:00', label: '昼 12:00' },
  //   { value: '15:00', label: '午後 3:00' },
  //   { value: '18:00', label: '夕方 6:00' },
  //   { value: '20:00', label: '夜 8:00' },
  //   { value: '22:00', label: '夜 10:00' }
  // ]

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bot className="h-8 w-8" />
          GPTs投稿スケジューラー
        </h1>
        <p className="text-gray-600 mt-2">
          GPTsで生成された投稿のスケジュール管理
        </p>
      </div>

      {/* フィルター */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">プラットフォーム</label>
              <Select value={selectedPlatform} onValueChange={(value: 'all' | 'x' | 'note' | 'wordpress') => setSelectedPlatform(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="x">X (Twitter)</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="wordpress">WordPress</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">ステータス</label>
              <Select value={selectedStatus} onValueChange={(value: 'all' | 'draft' | 'pending') => setSelectedStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="draft">スケジュール待ち</SelectItem>
                  <SelectItem value="pending">スケジュール済み</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={fetchPosts} variant="outline">
                更新
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 投稿一覧 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full text-center py-8">
            読み込み中...
          </div>
        ) : posts.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <Bot className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">GPTsからの投稿がありません</p>
            <p className="text-sm text-gray-400 mt-2">
              GPTsで投稿を生成すると、ここに表示されます
            </p>
          </div>
        ) : (
          posts.map((post) => {
            const config = platformConfig[post.platform]
            const Icon = config.icon

            return (
              <Card key={post.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${config.color} text-white`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {config.name}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {new Date(post.created_at).toLocaleString('ja-JP')}
                        </CardDescription>
                      </div>
                    </div>
                    {post.status === 'draft' ? (
                      <Badge variant="outline">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        要スケジュール
                      </Badge>
                    ) : post.status === 'pending' ? (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(post.scheduled_for!).toLocaleDateString('ja-JP')}
                      </Badge>
                    ) : (
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        公開済み
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 mb-4 line-clamp-4">
                    {post.content}
                  </p>

                  <div className="flex justify-between items-start mb-4">
                    <div className="text-xs text-gray-500">
                      <p>文字数: {post.content.length}/{config.maxLength}</p>
                      <p>生成: {post.metadata.model}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => deletePost(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {post.status === 'draft' && (
                    <div className="space-y-3">
                      {/* クイックスケジュール */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const tomorrow = new Date()
                            tomorrow.setDate(tomorrow.getDate() + 1)
                            tomorrow.setHours(10, 0, 0, 0)
                            schedulePost(post.id, tomorrow.toISOString())
                          }}
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          明日10時
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const today = new Date()
                            today.setHours(20, 0, 0, 0)
                            schedulePost(post.id, today.toISOString())
                          }}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          今日20時
                        </Button>
                      </div>

                      {/* カスタム時間設定 */}
                      <div className="flex gap-2">
                        <input
                          type="datetime-local"
                          className="flex-1 px-3 py-1 text-sm border rounded-md"
                          onChange={(e) => {
                            if (e.target.value) {
                              schedulePost(post.id, new Date(e.target.value).toISOString())
                            }
                          }}
                        />
                      </div>

                      {/* 今すぐ投稿 */}
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => publishNow(post.id)}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        今すぐ投稿
                      </Button>
                    </div>
                  )}

                  {post.status === 'pending' && post.scheduled_for && (
                    <div className="space-y-2">
                      <div className="text-sm text-center p-2 bg-gray-50 rounded">
                        <Clock className="h-4 w-4 inline mr-1" />
                        {new Date(post.scheduled_for).toLocaleString('ja-JP')}
                        に投稿予定
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => schedulePost(post.id, null)}
                      >
                        スケジュールを解除
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}