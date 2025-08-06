'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Clock, Edit, Trash2, Save, X as XIcon, Twitter, FileText, Globe, Loader2, Send } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface ScheduledPost {
  id: string
  content: string
  platform: 'x' | 'note' | 'wordpress'
  scheduled_at: string
  status: 'pending' | 'posted' | 'failed'
  order_index: number
  interval_minutes: number
  error_message?: string
  posted_at?: string
  created_at: string
}

const platformIcons = {
  x: Twitter,
  note: FileText,
  wordpress: Globe
}

const platformNames = {
  x: 'X (Twitter)',
  note: 'Note',
  wordpress: 'WordPress'
}

const statusLabels = {
  pending: '投稿待ち',
  posted: '投稿済み',
  failed: '失敗'
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  posted: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800'
}

export default function ScheduledPostsPage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPosting, setIsPosting] = useState<string | null>(null)
  const [isDeletingFailed, setIsDeletingFailed] = useState(false)

  useEffect(() => {
    fetchScheduledPosts()
    // 30秒ごとに自動更新
    const interval = setInterval(fetchScheduledPosts, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchScheduledPosts = async () => {
    try {
      const response = await fetch('/api/x/schedule', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setPosts(data || [])
      }
    } catch (error) {
      console.error('Failed to fetch scheduled posts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (post: ScheduledPost) => {
    setEditingPost(post)
    setEditContent(post.content)
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editingPost) return
    
    setIsSaving(true)
    try {
      const response = await fetch('/api/x/schedule/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPost.id,
          content: editContent
        })
      })

      if (response.ok) {
        await fetchScheduledPosts()
        setIsDialogOpen(false)
        setEditingPost(null)
        setEditContent('')
      } else {
        alert('更新に失敗しました')
      }
    } catch (error) {
      console.error('Failed to update post:', error)
      alert('更新に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この投稿を削除してもよろしいですか？')) return

    try {
      const response = await fetch(`/api/x/scheduled-posts/delete?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        await fetchScheduledPosts()
      } else {
        alert('削除に失敗しました')
      }
    } catch (error) {
      console.error('Failed to delete post:', error)
      alert('削除に失敗しました')
    }
  }

  const handleDeleteFailedPosts = async () => {
    if (!confirm('失敗したすべての投稿を削除してもよろしいですか？')) return

    setIsDeletingFailed(true)
    try {
      const failedPosts = posts.filter(p => p.status === 'failed')
      const ids = failedPosts.map(p => p.id)
      
      if (ids.length === 0) {
        alert('削除する投稿がありません')
        return
      }

      const response = await fetch('/api/x/scheduled-posts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status: 'failed' }),
        credentials: 'include'
      })

      if (response.ok) {
        await fetchScheduledPosts()
        alert(`${ids.length}件の失敗した投稿を削除しました`)
      } else {
        alert('削除に失敗しました')
      }
    } catch (error) {
      console.error('Failed to delete failed posts:', error)
      alert('削除に失敗しました')
    } finally {
      setIsDeletingFailed(false)
    }
  }

  const handlePostNow = async (post: ScheduledPost) => {
    setIsPosting(post.id)
    
    try {
      // プラットフォームに応じたAPIを呼び出す
      const endpoint = post.platform === 'x' ? '/api/x/post' : 
                      post.platform === 'note' ? '/api/note/post' : 
                      '/api/wordpress/post'
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: post.content
        })
      })

      if (response.ok) {
        // 投稿成功したらステータスを更新
        await fetch('/api/x/schedule/update-status', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: post.id,
            status: 'posted',
            posted_at: new Date().toISOString()
          })
        })
        
        await fetchScheduledPosts()
        alert('投稿しました！')
      } else {
        const error = await response.json()
        alert(`投稿に失敗しました: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to post:', error)
      alert('投稿に失敗しました')
    } finally {
      setIsPosting(null)
    }
  }

  const groupPostsByPlatform = () => {
    const grouped: { [key: string]: ScheduledPost[] } = {
      x: [],
      note: [],
      wordpress: []
    }
    
    posts.forEach(post => {
      if (grouped[post.platform]) {
        grouped[post.platform].push(post)
      }
    })
    
    return grouped
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const groupedPosts = groupPostsByPlatform()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8" />
              スケジュール投稿管理
            </h1>
            <p className="text-gray-600 mt-2">
              予約されている投稿の編集・削除ができます
            </p>
          </div>
          {posts.some(p => p.status === 'failed') && (
            <Button
              onClick={handleDeleteFailedPosts}
              variant="destructive"
              disabled={isDeletingFailed}
            >
              {isDeletingFailed ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  削除中...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  失敗した投稿をすべて削除
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {posts.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600">スケジュールされた投稿はありません</p>
            <p className="text-sm text-gray-500 mt-2">
              コンテンツ生成&配信ページから投稿をスケジュールしてください
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedPosts).map(([platform, platformPosts]) => {
            if (platformPosts.length === 0) return null
            
            const Icon = platformIcons[platform as keyof typeof platformIcons]
            
            return (
              <div key={platform}>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {platformNames[platform as keyof typeof platformNames]}
                </h2>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {platformPosts.map((post) => (
                    <Card key={post.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-sm">
                              {format(new Date(post.scheduled_at), 'M月d日 HH:mm', { locale: ja })}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 text-xs rounded-full ${statusColors[post.status]}`}>
                                {statusLabels[post.status]}
                              </span>
                              <span className="text-xs">
                                {post.interval_minutes}分間隔
                              </span>
                            </CardDescription>
                          </div>
                          {post.status === 'pending' && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handlePostNow(post)}
                                disabled={isPosting === post.id}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                {isPosting === post.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(post)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(post.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {post.content}
                        </p>
                        {post.error_message && (
                          <p className="text-xs text-red-600 mt-2">
                            エラー: {post.error_message}
                          </p>
                        )}
                        {post.posted_at && (
                          <p className="text-xs text-gray-500 mt-2">
                            投稿日時: {format(new Date(post.posted_at), 'M月d日 HH:mm', { locale: ja })}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>投稿を編集</DialogTitle>
            <DialogDescription>
              内容を編集して保存してください
            </DialogDescription>
          </DialogHeader>
          {editingPost && (
            <div className="space-y-4 mt-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  投稿予定: {format(new Date(editingPost.scheduled_at), 'M月d日 HH:mm', { locale: ja })}
                </p>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={6}
                  maxLength={platformNames[editingPost.platform as keyof typeof platformNames] === 'X (Twitter)' ? 280 : 2000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editContent.length}/{platformNames[editingPost.platform as keyof typeof platformNames] === 'X (Twitter)' ? 280 : 2000}文字
                </p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setEditingPost(null)
                    setEditContent('')
                  }}
                >
                  <XIcon className="mr-2 h-4 w-4" />
                  キャンセル
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !editContent.trim()}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      保存
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}