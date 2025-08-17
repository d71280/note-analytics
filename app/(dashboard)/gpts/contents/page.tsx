'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Copy, Globe, FileText, Twitter, Trash2, CheckCircle, Clock, CheckSquare, Square } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

const platformNames = {
  x: 'X (Twitter)',
  note: 'Note',
  wordpress: 'WordPress'
}

// 等間隔投稿の時間間隔オプション
const intervalOptions = [
  { value: '10', label: '10分間隔' },
  { value: '30', label: '30分間隔' },
  { value: '60', label: '1時間間隔' },
  { value: '180', label: '3時間間隔' },
  { value: '360', label: '6時間間隔' },
  { value: '720', label: '12時間間隔' },
  { value: '1440', label: '24時間間隔' },
  { value: '4320', label: '72時間間隔' },
]

export default function GPTsContentsPage() {
  const [contents, setContents] = useState<GPTsContent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContents, setSelectedContents] = useState<Set<string>>(new Set())
  const [copySuccess, setCopySuccess] = useState<string | null>(null)
  const [isScheduling, setIsScheduling] = useState(false)
  const [isDeletingOld, setIsDeletingOld] = useState(false)
  
  // プラットフォームごとのスケジュール設定
  const [scheduleSettings, setScheduleSettings] = useState<{
    [key: string]: {
      startDate: string
      startTime: string
      interval: string
    }
  }>({
    x: { startDate: '', startTime: '09:00', interval: '60' },
    note: { startDate: '', startTime: '10:00', interval: '360' },
    wordpress: { startDate: '', startTime: '12:00', interval: '1440' }
  })

  useEffect(() => {
    fetchContents()
    // デフォルト日付を今日に設定
    const today = new Date().toISOString().split('T')[0]
    setScheduleSettings(prev => ({
      x: { ...prev.x, startDate: today },
      note: { ...prev.note, startDate: today },
      wordpress: { ...prev.wordpress, startDate: today }
    }))
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

  const toggleContentSelection = (contentId: string) => {
    const newSelected = new Set(selectedContents)
    if (newSelected.has(contentId)) {
      newSelected.delete(contentId)
    } else {
      newSelected.add(contentId)
    }
    setSelectedContents(newSelected)
  }

  const selectAllByPlatform = (platform: string) => {
    const platformContents = contents
      .filter(c => c.platform === platform && c.status === 'draft')
      .map(c => c.id)
    
    const newSelected = new Set(selectedContents)
    const allSelected = platformContents.every(id => newSelected.has(id))
    
    if (allSelected) {
      // 全て選択されている場合は選択解除
      platformContents.forEach(id => newSelected.delete(id))
    } else {
      // 一部または全て未選択の場合は全て選択
      platformContents.forEach(id => newSelected.add(id))
    }
    
    setSelectedContents(newSelected)
  }

  const scheduleSelectedContents = async () => {
    if (selectedContents.size === 0) {
      alert('スケジュールする投稿を選択してください')
      return
    }

    setIsScheduling(true)
    let successCount = 0
    let failCount = 0

    try {
      // 選択されたコンテンツをプラットフォームごとにグループ化
      const groupedContents: { [key: string]: string[] } = {}
      
      selectedContents.forEach(contentId => {
        const content = contents.find(c => c.id === contentId)
        if (content) {
          if (!groupedContents[content.platform]) {
            groupedContents[content.platform] = []
          }
          groupedContents[content.platform].push(contentId)
        }
      })

      // プラットフォームごとにスケジュール設定
      for (const [platform, contentIds] of Object.entries(groupedContents)) {
        const settings = scheduleSettings[platform]
        if (!settings.startDate || !settings.startTime) {
          alert(`${platformNames[platform as keyof typeof platformNames]}の開始日時を設定してください`)
          failCount += contentIds.length
          continue
        }

        const intervalMinutes = parseInt(settings.interval)
        let scheduledTime = new Date(`${settings.startDate}T${settings.startTime}`)

        // 各コンテンツに対して等間隔でスケジュール
        for (const contentId of contentIds) {
          try {
            const scheduledFor = new Date(scheduledTime).toISOString()
            
            console.log('Scheduling content:', { contentId, scheduledFor, platform })
            
            // タイムアウト付きのfetch
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒タイムアウト
            
            const response = await fetch(`/api/gpts/contents/${contentId}/schedule`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                scheduledFor,
                intervalMinutes: contentIds.indexOf(contentId) * intervalMinutes 
              }),
              signal: controller.signal
            })
            
            clearTimeout(timeoutId)

            if (!response.ok) {
              let errorMessage = 'Unknown error'
              try {
                const errorData = await response.json()
                errorMessage = errorData.error || errorData.details || errorMessage
              } catch (e) {
                console.error('Failed to parse error response:', e)
              }
              console.error('Failed to schedule content:', contentId, errorMessage)
              failCount++
            } else {
              const result = await response.json()
              console.log('Scheduled successfully:', result)
              successCount++
            }

            // 次の投稿時間を計算
            scheduledTime = new Date(scheduledTime.getTime() + intervalMinutes * 60 * 1000)
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
              console.error('Request timeout for content:', contentId)
            } else {
              console.error('Failed to schedule content:', contentId, error)
            }
            failCount++
          }
        }
      }

      // 結果を表示
      if (successCount > 0 && failCount === 0) {
        alert(`スケジュール設定が完了しました（${successCount}件）`)
        setSelectedContents(new Set())
        // データを再取得
        await fetchContents()
      } else if (successCount > 0 && failCount > 0) {
        alert(`一部のスケジュール設定に失敗しました\n成功: ${successCount}件\n失敗: ${failCount}件`)
        setSelectedContents(new Set())
        await fetchContents()
      } else {
        alert(`スケジュール設定に失敗しました（${failCount}件）`)
      }
    } catch (error) {
      console.error('Failed to schedule contents:', error)
      alert('スケジュール設定中にエラーが発生しました')
    } finally {
      setIsScheduling(false)
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

  const deleteOldContents = async () => {
    if (!confirm('30日以上前の古いGPTsコンテンツを削除しますか？')) return

    setIsDeletingOld(true)
    try {
      const response = await fetch('/api/gpts/delete-old', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ deleteCount: 20 })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`${result.deleted}件の古いコンテンツを削除しました`)
        fetchContents()
      } else {
        const error = await response.json()
        alert(`削除に失敗しました: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to delete old contents:', error)
      alert('削除中にエラーが発生しました')
    } finally {
      setIsDeletingOld(false)
    }
  }

  const copyToClipboard = (text: string, label?: string) => {
    navigator.clipboard.writeText(text)
    setCopySuccess(label || 'copied')
    setTimeout(() => setCopySuccess(null), 2000)
  }

  // プラットフォームごとにコンテンツをグループ化
  const groupedContents = contents.reduce((acc, content) => {
    if (!acc[content.platform]) acc[content.platform] = []
    acc[content.platform].push(content)
    return acc
  }, {} as { [key: string]: GPTsContent[] })

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">GPTs連携コンテンツ</h1>
            <p className="text-gray-600 mt-2">
              GPTsから受信したコンテンツを管理し、スケジュール配信を設定します
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={deleteOldContents}
              disabled={isDeletingOld || contents.length === 0}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isDeletingOld ? '削除中...' : '古いコンテンツを削除'}
            </Button>
            <div className="text-sm text-gray-500 flex items-center">
              全{contents.length}件
            </div>
          </div>
        </div>
      </div>

      {/* スケジュール設定パネル */}
      {selectedContents.size > 0 && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                スケジュール設定（{selectedContents.size}件選択中）
              </h3>
              <Button 
                onClick={() => setSelectedContents(new Set())}
                variant="ghost"
                size="sm"
              >
                選択解除
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(platformNames).map(([platform, name]) => {
                const selectedCount = Array.from(selectedContents).filter(id => 
                  contents.find(c => c.id === id)?.platform === platform
                ).length

                if (selectedCount === 0) return null

                return (
                  <div key={platform} className="space-y-3 p-4 bg-white rounded-lg">
                    <h4 className="font-medium flex items-center gap-2">
                      {React.createElement(platformIcons[platform as keyof typeof platformIcons], { className: 'h-4 w-4' })}
                      {name}（{selectedCount}件）
                    </h4>
                    
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs">開始日</Label>
                        <input
                          type="date"
                          value={scheduleSettings[platform].startDate}
                          onChange={(e) => setScheduleSettings(prev => ({
                            ...prev,
                            [platform]: { ...prev[platform], startDate: e.target.value }
                          }))}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs">開始時刻</Label>
                        <input
                          type="time"
                          value={scheduleSettings[platform].startTime}
                          onChange={(e) => setScheduleSettings(prev => ({
                            ...prev,
                            [platform]: { ...prev[platform], startTime: e.target.value }
                          }))}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs">投稿間隔</Label>
                        <Select
                          value={scheduleSettings[platform].interval}
                          onValueChange={(value) => setScheduleSettings(prev => ({
                            ...prev,
                            [platform]: { ...prev[platform], interval: value }
                          }))}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {intervalOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <Button 
              onClick={scheduleSelectedContents}
              className="w-full mt-4"
              disabled={isScheduling}
            >
              {isScheduling ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  スケジュール設定中...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  選択した投稿をスケジュール
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* コンテンツ一覧 */}
      <div className="space-y-6">
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
          Object.entries(groupedContents).map(([platform, platformContents]) => {
            const Icon = platformIcons[platform as keyof typeof platformIcons]
            const colorClass = platformColors[platform as keyof typeof platformColors]
            const draftContents = platformContents.filter(c => c.status === 'draft')
            const allSelected = draftContents.every(c => selectedContents.has(c.id))
            
            return (
              <div key={platform}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${colorClass} text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {platformNames[platform as keyof typeof platformNames]}
                    <span className="text-sm text-gray-500">（{platformContents.length}件）</span>
                  </h2>
                  {draftContents.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => selectAllByPlatform(platform)}
                    >
                      {allSelected ? (
                        <>
                          <CheckSquare className="h-4 w-4 mr-1" />
                          全て選択解除
                        </>
                      ) : (
                        <>
                          <Square className="h-4 w-4 mr-1" />
                          全て選択
                        </>
                      )}
                    </Button>
                  )}
                </div>
                
                <div className="space-y-3">
                  {platformContents.map((content) => (
                    <Card 
                      key={content.id} 
                      className={`hover:shadow-lg transition-all cursor-pointer ${
                        selectedContents.has(content.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => content.status === 'draft' && toggleContentSelection(content.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {/* 選択チェックボックス */}
                          {content.status === 'draft' && (
                            <div className="pt-1">
                              {selectedContents.has(content.id) ? (
                                <CheckSquare className="h-5 w-5 text-blue-600" />
                              ) : (
                                <Square className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                          )}
                          
                          {/* コンテンツ本文 */}
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-medium">
                                  {content.metadata?.title || `${platform.toUpperCase()}投稿`}
                                </h3>
                                <p className="text-xs text-gray-500">
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
                            
                            <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                              {content.content}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-gray-500">
                                {content.content.length}文字
                              </div>
                              
                              {/* アクションボタン */}
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
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
                                
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => deleteContent(content.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}