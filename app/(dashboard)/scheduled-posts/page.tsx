'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Clock, Edit, Trash2, Save, X as XIcon, Twitter, FileText, Globe, Loader2, Send, CheckSquare, Square } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface ScheduledPost {
  id: string
  content: string
  platform: 'x' | 'note' | 'wordpress'
  scheduled_for?: string
  scheduled_at?: string
  status: 'pending' | 'posted' | 'failed' | 'draft' | 'scheduled'
  order_index?: number
  interval_minutes?: number
  error_message?: string
  posted_at?: string
  created_at: string
  metadata?: any
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
  failed: '失敗',
  draft: '下書き',
  scheduled: 'スケジュール済み'
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  posted: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  draft: 'bg-gray-100 text-gray-800',
  scheduled: 'bg-blue-100 text-blue-800'
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
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set())
  const [isDeletingSelected, setIsDeletingSelected] = useState(false)

  useEffect(() => {
    fetchScheduledPosts()
    // 30秒ごとに自動更新
    const interval = setInterval(fetchScheduledPosts, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchScheduledPosts = async () => {
    try {
      const response = await fetch('/api/scheduled-posts', {
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

  const handleDeleteAllPosts = async () => {
    if (!confirm('すべての投稿を削除してもよろしいですか？この操作は取り消せません。')) return

    try {
      const response = await fetch('/api/x/scheduled-posts/delete-all?confirm=true', {
        method: 'DELETE',
        credentials: 'include'
      })

      const result = await response.json()
      
      if (response.ok) {
        await fetchScheduledPosts()
        alert(`${result.deleted}件の投稿を削除しました`)
      } else {
        alert(`削除に失敗しました: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to delete all posts:', error)
      alert('一括削除に失敗しました')
    }
  }

  const toggleSelectPost = (postId: string) => {
    const newSelected = new Set(selectedPosts)
    if (newSelected.has(postId)) {
      newSelected.delete(postId)
    } else {
      newSelected.add(postId)
    }
    setSelectedPosts(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedPosts.size === posts.length) {
      setSelectedPosts(new Set())
    } else {
      setSelectedPosts(new Set(posts.map(p => p.id)))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedPosts.size === 0) {
      alert('削除する投稿を選択してください')
      return
    }

    if (!confirm(`${selectedPosts.size}件の投稿を削除してもよろしいですか？`)) return

    setIsDeletingSelected(true)
    try {
      const response = await fetch('/api/x/scheduled-posts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedPosts) })
      })

      if (response.ok) {
        setSelectedPosts(new Set())
        await fetchScheduledPosts()
      } else {
        alert('削除に失敗しました')
      }
    } catch (error) {
      console.error('Failed to delete selected posts:', error)
      alert('削除に失敗しました')
    } finally {
      setIsDeletingSelected(false)
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
          <div className="flex gap-2">
            {selectedPosts.size > 0 && (
              <Button
                onClick={handleDeleteSelected}
                variant="destructive"
                disabled={isDeletingSelected}
              >
                {isDeletingSelected ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    削除中...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    選択した{selectedPosts.size}件を削除
                  </>
                )}
              </Button>
            )}
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
            {posts.length > 0 && (
              <Button
                onClick={handleDeleteAllPosts}
                variant="destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                すべての投稿を削除
              </Button>
            )}
          </div>
        </div>
      </div>

      {posts.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600">スケジュールされた投稿はありません</p>
            <p className="text-sm text-gray-500 mt-2">
              GPTs連携ページから投稿をスケジュールしてください
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedPosts).map(([platform, platformPosts]) => {
            if (platformPosts.length === 0) return null
            
            const Icon = platformIcons[platform as keyof typeof platformIcons]
            
            return (
              <div key={platform} className="space-y-4">
                <Card>
                  <CardHeader className="bg-gray-50">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${
                          platform === 'x' ? 'bg-blue-500' :
                          platform === 'note' ? 'bg-green-500' :
                          'bg-purple-500'
                        } text-white`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        {platformNames[platform as keyof typeof platformNames]}
                        <span className="text-sm text-gray-500 ml-2">({platformPosts.length}件)</span>
                      </h2>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {platformPosts.map((post) => (
                        <div key={post.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                          <div className="flex justify-between items-start">
                            <div className="flex items-start gap-3 flex-1">
                              <button
                                onClick={() => toggleSelectPost(post.id)}
                                className="mt-1 flex-shrink-0"
                              >
                                {selectedPosts.has(post.id) ? (
                                  <CheckSquare className="h-5 w-5 text-blue-600" />
                                ) : (
                                  <Square className="h-5 w-5 text-gray-400" />
                                )}
                              </button>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`px-2 py-1 text-xs rounded-full ${statusColors[post.status]}`}>
                                    {statusLabels[post.status]}
                                  </span>
                                  {(post.scheduled_for || post.scheduled_at) && (
                                    <span className="text-sm text-gray-500">
                                      {format(new Date(post.scheduled_for || post.scheduled_at || Date.now()), 'M月d日 HH:mm', { locale: ja })}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-700 line-clamp-2">
                                  {post.content}
                                </p>
                                {post.error_message && (
                                  <p className="text-xs text-red-600 mt-2">
                                    エラー: {post.error_message}
                                  </p>
                                )}
                              </div>
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
                  投稿予定: {format(new Date(editingPost.scheduled_for || editingPost.scheduled_at || Date.now()), 'M月d日 HH:mm', { locale: ja })}
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