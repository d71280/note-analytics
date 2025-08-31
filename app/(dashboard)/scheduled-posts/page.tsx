'use client'

import { useState, useEffect, createElement } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, Clock, Edit, Trash2, Save, X as XIcon, Twitter, FileText, Globe, Loader2, Send, CheckSquare, Square, CalendarPlus, Play, Pause, RotateCw } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
  display_order?: number
  error_message?: string
  posted_at?: string
  created_at: string
  metadata?: Record<string, unknown>
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
  const [editScheduledTime, setEditScheduledTime] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isContentOnlyEdit, setIsContentOnlyEdit] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPosting, setIsPosting] = useState<string | null>(null)
  const [isDeletingFailed, setIsDeletingFailed] = useState(false)
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set())
  const [selectionOrder, setSelectionOrder] = useState<Map<string, number>>(new Map())
  const [isDeletingSelected, setIsDeletingSelected] = useState(false)
  const [activeTab, setActiveTab] = useState<'draft' | 'pending' | 'completed'>('draft')
  const [isBulkScheduling, setIsBulkScheduling] = useState(false)
  const [bulkScheduleTime, setBulkScheduleTime] = useState('')
  const [bulkInterval, setBulkInterval] = useState(60) // 分単位
  const [schedulerStatus, setSchedulerStatus] = useState<'stopped' | 'running'>('running')

  useEffect(() => {
    fetchScheduledPosts()
    
    // スケジューラーの状態を確認
    const checkSchedulerStatus = async () => {
      try {
        const response = await fetch('/api/scheduler/start?action=status')
        if (response.ok) {
          const data = await response.json()
          setSchedulerStatus(data.isRunning ? 'running' : 'stopped')
        }
      } catch (error) {
        console.error('Failed to check scheduler status:', error)
      }
    }
    
    checkSchedulerStatus()
    
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
    const scheduledTime = post.scheduled_for || post.scheduled_at || new Date().toISOString()
    // 日時をローカルフォーマットに変換
    const localDateTime = new Date(scheduledTime).toISOString().slice(0, 16)
    setEditScheduledTime(localDateTime)
    setIsContentOnlyEdit(false)
    setIsDialogOpen(true)
  }

  const handleEditContent = (post: ScheduledPost) => {
    // 状態をリセットしてから新しい値を設定
    setEditContent('')
    setEditingPost(null)
    
    // 次のレンダリングサイクルで値を設定
    setTimeout(() => {
      setEditingPost(post)
      setEditContent(post.content)
      // 下書きの編集では時刻設定は不要
      setEditScheduledTime('')
      setIsContentOnlyEdit(true)
      setIsDialogOpen(true)
    }, 0)
  }

  const handleSave = async () => {
    if (!editingPost) return
    
    setIsSaving(true)
    try {
      // 更新用のデータを準備
      const updateData: {
        id: string
        content: string
        status: string
        scheduled_for?: string
        display_order?: number
      } = {
        id: editingPost.id,
        content: editContent,
        status: editingPost.status
      }
      
      // スケジュール登録モードの場合のみ時刻を設定
      if (!isContentOnlyEdit && editScheduledTime) {
        updateData.scheduled_for = new Date(editScheduledTime).toISOString()
        // 下書きからスケジュール登録する場合は、statusをpendingに変更
        if (editingPost.status === 'draft') {
          updateData.status = 'pending'
        }
      }

      const response = await fetch('/api/scheduled-posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
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
      const response = await fetch(`/api/scheduled-posts/delete?id=${id}`, {
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

      const response = await fetch('/api/scheduled-posts/delete', {
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
      const response = await fetch('/api/scheduled-posts/delete-all?confirm=true', {
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

  const handleSchedulerControl = async (action: 'start' | 'stop' | 'run') => {
    try {
      const response = await fetch(`/api/scheduler/start?action=${action}&interval=1`)
      const data = await response.json()
      
      if (data.success) {
        if (action === 'start') {
          setSchedulerStatus('running')
          alert('自動投稿スケジューラーを開始しました（1分間隔）')
        } else if (action === 'stop') {
          setSchedulerStatus('stopped')
          alert('自動投稿スケジューラーを停止しました')
        } else if (action === 'run') {
          alert('スケジューラーを手動実行しました')
          await fetchScheduledPosts()
        }
      }
    } catch (error) {
      console.error('Scheduler control error:', error)
      alert('スケジューラーの操作に失敗しました')
    }
  }

  const toggleSelectPost = (postId: string) => {
    const newSelected = new Set(selectedPosts)
    const newOrder = new Map(selectionOrder)
    
    if (newSelected.has(postId)) {
      newSelected.delete(postId)
      newOrder.delete(postId)
      // 削除後、残りの番号を詰める
      const deletedOrder = selectionOrder.get(postId) || 0
      newOrder.forEach((order, id) => {
        if (order > deletedOrder) {
          newOrder.set(id, order - 1)
        }
      })
    } else {
      newSelected.add(postId)
      // 新しい選択には次の番号を割り当て
      const maxOrder = Math.max(0, ...Array.from(newOrder.values()))
      newOrder.set(postId, maxOrder + 1)
    }
    
    setSelectedPosts(newSelected)
    setSelectionOrder(newOrder)
  }


  const handleBulkSchedule = async () => {
    // 選択された順番を保持するため、選択順でソート
    const selectedPostIds = Array.from(selectedPosts).sort((a, b) => {
      const orderA = selectionOrder.get(a) || 0
      const orderB = selectionOrder.get(b) || 0
      return orderA - orderB
    })
    
    const draftPosts = selectedPostIds
      .map(id => posts.find(p => p.id === id && p.status === 'draft'))
      .filter(Boolean) as ScheduledPost[]
    
    if (draftPosts.length === 0) {
      alert('スケジュール登録する下書きを選択してください')
      return
    }

    if (!bulkScheduleTime) {
      alert('開始時刻を設定してください')
      return
    }

    setIsBulkScheduling(true)
    try {
      const startTime = new Date(bulkScheduleTime)
      
      // 選択した順番（display_order）を保持して更新
      for (let i = 0; i < draftPosts.length; i++) {
        const post = draftPosts[i]
        const scheduledTime = new Date(startTime.getTime() + i * bulkInterval * 60000)
        
        const updateData = {
          id: post.id,
          scheduled_for: scheduledTime.toISOString(),
          status: 'pending',
          display_order: i + 1  // 選択順を1から割り当て
        }

        await fetch('/api/scheduled-posts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        })
      }

      await fetchScheduledPosts()
      setSelectedPosts(new Set())
      setSelectionOrder(new Map())
      alert(`${draftPosts.length}件の投稿をスケジュール登録しました（選択順: 1〜${draftPosts.length}）`)
    } catch (error) {
      console.error('Failed to bulk schedule:', error)
      alert('一括スケジュール登録に失敗しました')
    } finally {
      setIsBulkScheduling(false)
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
      const response = await fetch('/api/scheduled-posts/delete', {
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
          text: post.content,
          content: post.content,
          platform: post.platform,
          title: post.metadata?.title || `${post.platform.toUpperCase()}投稿`
        })
      })

      if (response.ok) {
        // 投稿成功したらステータスを更新
        const updateResponse = await fetch('/api/scheduled-posts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: post.id,
            status: 'posted',
            metadata: {
              ...post.metadata,
              posted_at: new Date().toISOString(),
              posted_manually: true
            }
          })
        })
        
        if (updateResponse.ok) {
          await fetchScheduledPosts()
          // 投稿完了タブに切り替え
          setActiveTab('completed')
          alert('投稿が完了しました！')
        } else {
          console.error('Failed to update post status')
          alert('投稿は成功しましたが、ステータスの更新に失敗しました')
        }
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
    
    // タブに応じてフィルタリング
    const filteredPosts = posts.filter(post => {
      if (activeTab === 'draft') {
        return post.status === 'draft'
      } else if (activeTab === 'pending') {
        return post.status === 'pending' || post.status === 'scheduled'
      } else {
        return post.status === 'posted' || post.status === 'failed'
      }
    })
    
    filteredPosts.forEach(post => {
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
  
  // 各タブの投稿数を計算
  const draftCount = posts.filter(post => post.status === 'draft').length
  const pendingCount = posts.filter(post => 
    post.status === 'pending' || post.status === 'scheduled'
  ).length
  const completedCount = posts.filter(post => 
    post.status === 'posted' || post.status === 'failed'
  ).length

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
            <div className="flex gap-2 mt-3">
              <Button
                onClick={() => handleSchedulerControl(schedulerStatus === 'stopped' ? 'start' : 'stop')}
                variant={schedulerStatus === 'running' ? 'destructive' : 'default'}
                size="sm"
              >
                {schedulerStatus === 'running' ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    停止
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    自動投稿開始
                  </>
                )}
              </Button>
              <Button
                onClick={() => handleSchedulerControl('run')}
                variant="outline"
                size="sm"
              >
                <RotateCw className="mr-2 h-4 w-4" />
                今すぐチェック
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            {activeTab === 'draft' && selectedPosts.size > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="default"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    選択した{selectedPosts.size}件を一括スケジュール
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>一括スケジュール登録</DialogTitle>
                    <DialogDescription>
                      選択した投稿を指定間隔でスケジュール登録します
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="bulk-start-time">開始時刻</Label>
                      <Input
                        id="bulk-start-time"
                        type="datetime-local"
                        value={bulkScheduleTime}
                        onChange={(e) => setBulkScheduleTime(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bulk-interval">投稿間隔（分）</Label>
                      <Input
                        id="bulk-interval"
                        type="number"
                        value={bulkInterval}
                        onChange={(e) => setBulkInterval(parseInt(e.target.value) || 60)}
                        min={1}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        例: 60 = 1時間間隔、30 = 30分間隔
                      </p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={handleBulkSchedule}
                        disabled={isBulkScheduling || !bulkScheduleTime}
                      >
                        {isBulkScheduling ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            登録中...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            スケジュール登録
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
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
            {activeTab === 'completed' && posts.some(p => p.status === 'failed') && (
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

      {/* タブナビゲーション */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('draft')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'draft'
                  ? 'border-gray-500 text-gray-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Edit className="h-4 w-4" />
              下書き
              {draftCount > 0 && (
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {draftCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock className="h-4 w-4" />
              投稿待ち
              {pendingCount > 0 && (
                <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'completed'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CheckSquare className="h-4 w-4" />
              投稿完了
              {completedCount > 0 && (
                <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded-full text-xs">
                  {completedCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {posts.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600">スケジュールされた投稿はありません</p>
            <p className="text-sm text-gray-500 mt-2">
              GPTsから投稿を送信してください
            </p>
          </CardContent>
        </Card>
      ) : Object.values(groupedPosts).every(posts => posts.length === 0) ? (
        <Card className="text-center py-12">
          <CardContent>
            {activeTab === 'draft' ? (
              <>
                <Edit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-600">下書きはありません</p>
                <p className="text-sm text-gray-500 mt-2">
                  GPTsから受信したコンテンツがここに表示されます
                </p>
              </>
            ) : activeTab === 'pending' ? (
              <>
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-600">投稿待ちの投稿はありません</p>
                <p className="text-sm text-gray-500 mt-2">
                  スケジュール設定済みの投稿がここに表示されます
                </p>
              </>
            ) : (
              <>
                <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-600">投稿完了した投稿はありません</p>
                <p className="text-sm text-gray-500 mt-2">
                  投稿済みの投稿がここに表示されます
                </p>
              </>
            )}
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
                      {platformPosts
                        .sort((a, b) => {
                          const dateA = new Date(a.scheduled_for || a.scheduled_at || a.created_at).getTime()
                          const dateB = new Date(b.scheduled_for || b.scheduled_at || b.created_at).getTime()
                          return dateB - dateA // 新しい順（降順）
                        })
                        .map((post) => (
                        <div key={post.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                          <div className="flex justify-between items-start">
                            <div className="flex items-start gap-3 flex-1">
                              <button
                                onClick={() => toggleSelectPost(post.id)}
                                className="mt-1 flex-shrink-0 relative"
                              >
                                {selectedPosts.has(post.id) ? (
                                  <>
                                    <CheckSquare className="h-5 w-5 text-blue-600" />
                                    {activeTab === 'draft' && selectionOrder.get(post.id) && (
                                      <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                                        {selectionOrder.get(post.id)}
                                      </span>
                                    )}
                                  </>
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
                            {(post.status === 'pending' || post.status === 'draft' || post.status === 'scheduled') ? (
                              <div className="flex gap-1 ml-2 flex-shrink-0">
                                {post.status === 'draft' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditContent(post)}
                                      title="文章を編集"
                                    >
                                      <Edit className="h-4 w-4 mr-1" />
                                      編集
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => handleEdit(post)}
                                      className="bg-blue-600 hover:bg-blue-700 text-white"
                                      title="スケジュール登録"
                                    >
                                      <CalendarPlus className="h-4 w-4 mr-1" />
                                      スケジュール登録
                                    </Button>
                                  </>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handlePostNow(post)}
                                  disabled={isPosting === post.id}
                                  className="text-blue-600 hover:text-blue-700"
                                  title="今すぐ投稿"
                                >
                                  {isPosting === post.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Send className="h-4 w-4" />
                                  )}
                                </Button>
                                {(post.status === 'pending' || post.status === 'scheduled') && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEdit(post)}
                                    title="編集"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(post.id)}
                                  className="text-red-600 hover:text-red-700"
                                  title="削除"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-1 ml-2 flex-shrink-0">
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
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {isContentOnlyEdit 
                ? '下書きを編集' 
                : editingPost?.status === 'draft' 
                  ? 'スケジュール登録' 
                  : '投稿を編集'}
            </DialogTitle>
            <DialogDescription>
              {isContentOnlyEdit
                ? '投稿内容を編集して保存してください'
                : editingPost?.status === 'draft' 
                  ? '投稿時刻を設定してスケジュール登録します'
                  : '内容を編集して保存してください'}
            </DialogDescription>
          </DialogHeader>
          {editingPost && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-4 pb-3 border-b">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${
                    editingPost.platform === 'x' ? 'bg-blue-500' :
                    editingPost.platform === 'note' ? 'bg-green-500' :
                    'bg-purple-500'
                  } text-white`}>
                    {createElement(platformIcons[editingPost.platform as keyof typeof platformIcons], { className: 'h-4 w-4' })}
                  </div>
                  <span className="font-semibold">
                    {platformNames[editingPost.platform as keyof typeof platformNames]}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  投稿予定: {format(new Date(editingPost.scheduled_for || editingPost.scheduled_at || Date.now()), 'M月d日 HH:mm', { locale: ja })}
                </p>
              </div>
              
              <div className="space-y-4">
                {!isContentOnlyEdit && (
                  <div>
                    <Label htmlFor="scheduled-time">投稿予定時刻</Label>
                    <Input
                      id="scheduled-time"
                      type="datetime-local"
                      value={editScheduledTime}
                      onChange={(e) => setEditScheduledTime(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      現在より後の時刻を選択してください
                    </p>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="content">投稿内容</Label>
                  <Textarea
                    id="content"
                    value={editContent}
                    onChange={(e) => {
                      e.preventDefault();
                      setEditContent(e.target.value);
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      setEditContent(target.value);
                    }}
                    rows={15}
                    maxLength={
                      editingPost.platform === 'x' ? 280 :
                      editingPost.platform === 'note' ? 10000 :
                      50000
                    }
                    className="min-h-[400px] text-base mt-1"
                    placeholder="ここに内容を入力..."
                  />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-gray-500">
                    {editContent.length}/{editingPost.platform === 'x' ? 280 : editingPost.platform === 'note' ? 10000 : 50000}文字
                  </p>
                  <div className="text-xs text-gray-400">
                    {
                      editingPost.platform === 'x' ? '最大280文字' :
                      editingPost.platform === 'note' ? '推奨1500-2500文字' :
                      '推奨3000文字以上'
                    }
                  </div>
                </div>
                </div>
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