'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Calendar, Clock, Plus, Trash2, Save, RefreshCw, TrendingUp, FileText } from 'lucide-react'

interface TimeSlot {
  id: string
  time: string
}

interface PostSchedule {
  type: 'trend' | 'article' | 'custom'
  enabled: boolean
  timeSlots: TimeSlot[]
  weekdays: number[]
  contentSource: {
    useTrends: boolean
    useTopArticles: boolean
    useAI: boolean
    customPrompt?: string
  }
}

const WEEKDAYS = [
  { value: 1, label: '月' },
  { value: 2, label: '火' },
  { value: 3, label: '水' },
  { value: 4, label: '木' },
  { value: 5, label: '金' },
  { value: 6, label: '土' },
  { value: 7, label: '日' },
]

export default function SchedulePage() {
  const [postSchedule, setPostSchedule] = useState<PostSchedule>({
    type: 'trend',
    enabled: false,
    timeSlots: [
      { id: '1', time: '09:00' },
      { id: '2', time: '18:00' }
    ],
    weekdays: [1, 2, 3, 4, 5],
    contentSource: {
      useTrends: true,
      useTopArticles: false,
      useAI: true
    }
  })

  const [retweetSchedule, setRetweetSchedule] = useState({
    enabled: false,
    timeSlots: [
      { id: '1', time: '12:00' },
      { id: '2', time: '21:00' }
    ],
    weekdays: [1, 2, 3, 4, 5, 6, 7]
  })

  const addTimeSlot = (type: 'post' | 'retweet') => {
    const newSlot = {
      id: Date.now().toString(),
      time: '12:00'
    }
    
    if (type === 'post') {
      setPostSchedule({
        ...postSchedule,
        timeSlots: [...postSchedule.timeSlots, newSlot]
      })
    } else {
      setRetweetSchedule({
        ...retweetSchedule,
        timeSlots: [...retweetSchedule.timeSlots, newSlot]
      })
    }
  }

  const removeTimeSlot = (type: 'post' | 'retweet', id: string) => {
    if (type === 'post') {
      setPostSchedule({
        ...postSchedule,
        timeSlots: postSchedule.timeSlots.filter(slot => slot.id !== id)
      })
    } else {
      setRetweetSchedule({
        ...retweetSchedule,
        timeSlots: retweetSchedule.timeSlots.filter(slot => slot.id !== id)
      })
    }
  }

  const updateTimeSlot = (type: 'post' | 'retweet', id: string, time: string) => {
    if (type === 'post') {
      setPostSchedule({
        ...postSchedule,
        timeSlots: postSchedule.timeSlots.map(slot => 
          slot.id === id ? { ...slot, time } : slot
        )
      })
    } else {
      setRetweetSchedule({
        ...retweetSchedule,
        timeSlots: retweetSchedule.timeSlots.map(slot => 
          slot.id === id ? { ...slot, time } : slot
        )
      })
    }
  }

  const toggleWeekday = (type: 'post' | 'retweet', day: number) => {
    if (type === 'post') {
      const weekdays = postSchedule.weekdays.includes(day)
        ? postSchedule.weekdays.filter(d => d !== day)
        : [...postSchedule.weekdays, day].sort()
      setPostSchedule({ ...postSchedule, weekdays })
    } else {
      const weekdays = retweetSchedule.weekdays.includes(day)
        ? retweetSchedule.weekdays.filter(d => d !== day)
        : [...retweetSchedule.weekdays, day].sort()
      setRetweetSchedule({ ...retweetSchedule, weekdays })
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch('/api/x/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postSchedule,
          retweetSchedule
        })
      })
      
      if (response.ok) {
        alert('スケジュール設定を保存しました')
      }
    } catch (error) {
      console.error('Save error:', error)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">投稿スケジュール設定</h1>

      <div className="space-y-6">
        {/* 自動投稿スケジュール */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              自動投稿スケジュール
            </CardTitle>
            <CardDescription>
              noteのトレンドや人気記事を自動的にツイートします
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>自動投稿を有効化</Label>
                <Switch
                  checked={postSchedule.enabled}
                  onCheckedChange={(checked) => 
                    setPostSchedule({ ...postSchedule, enabled: checked })
                  }
                />
              </div>

              {/* コンテンツソース設定 */}
              <div className="space-y-3 p-4 border rounded-lg">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  投稿内容の設定
                </h4>
                
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={postSchedule.contentSource.useTrends}
                      onChange={(e) => setPostSchedule({
                        ...postSchedule,
                        contentSource: {
                          ...postSchedule.contentSource,
                          useTrends: e.target.checked
                        }
                      })}
                      className="rounded"
                    />
                    <span className="text-sm">本日のnoteトレンドを投稿</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={postSchedule.contentSource.useTopArticles}
                      onChange={(e) => setPostSchedule({
                        ...postSchedule,
                        contentSource: {
                          ...postSchedule.contentSource,
                          useTopArticles: e.target.checked
                        }
                      })}
                      className="rounded"
                    />
                    <span className="text-sm">注目記事を紹介</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={postSchedule.contentSource.useAI}
                      onChange={(e) => setPostSchedule({
                        ...postSchedule,
                        contentSource: {
                          ...postSchedule.contentSource,
                          useAI: e.target.checked
                        }
                      })}
                      className="rounded"
                    />
                    <span className="text-sm">AI（Grok/Gemini）で文章を生成</span>
                  </label>
                </div>

                {postSchedule.contentSource.useAI && (
                  <div className="mt-3">
                    <Label>AIプロンプト（オプション）</Label>
                    <Input
                      placeholder="例: カジュアルな口調で、絵文字多めに"
                      value={postSchedule.contentSource.customPrompt || ''}
                      onChange={(e) => setPostSchedule({
                        ...postSchedule,
                        contentSource: {
                          ...postSchedule.contentSource,
                          customPrompt: e.target.value
                        }
                      })}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>

              {/* 投稿時間設定 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>投稿時間</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addTimeSlot('post')}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    時間を追加
                  </Button>
                </div>
                
                {postSchedule.timeSlots.map((slot) => (
                  <div key={slot.id} className="flex gap-2 items-center">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <Input
                      type="time"
                      value={slot.time}
                      onChange={(e) => updateTimeSlot('post', slot.id, e.target.value)}
                      className="w-32"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeTimeSlot('post', slot.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* 曜日設定 */}
              <div className="space-y-2">
                <Label>投稿する曜日</Label>
                <div className="flex gap-2">
                  {WEEKDAYS.map((day) => (
                    <Button
                      key={day.value}
                      size="sm"
                      variant={postSchedule.weekdays.includes(day.value) ? "default" : "outline"}
                      onClick={() => toggleWeekday('post', day.value)}
                    >
                      {day.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 投稿例</strong><br />
                  朝9時: 「おはようございます！本日のnoteトレンド...」<br />
                  夕方18時: 「今日の注目記事はこちら！」
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 自動リツイートスケジュール */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              自動リツイートスケジュール
            </CardTitle>
            <CardDescription>
              設定したキーワードのツイートを定期的にリツイートします
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>自動リツイートを有効化</Label>
                <Switch
                  checked={retweetSchedule.enabled}
                  onCheckedChange={(checked) => 
                    setRetweetSchedule({ ...retweetSchedule, enabled: checked })
                  }
                />
              </div>

              {/* リツイート時間設定 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>リツイート実行時間</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addTimeSlot('retweet')}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    時間を追加
                  </Button>
                </div>
                
                {retweetSchedule.timeSlots.map((slot) => (
                  <div key={slot.id} className="flex gap-2 items-center">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <Input
                      type="time"
                      value={slot.time}
                      onChange={(e) => updateTimeSlot('retweet', slot.id, e.target.value)}
                      className="w-32"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeTimeSlot('retweet', slot.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* 曜日設定 */}
              <div className="space-y-2">
                <Label>リツイートする曜日</Label>
                <div className="flex gap-2">
                  {WEEKDAYS.map((day) => (
                    <Button
                      key={day.value}
                      size="sm"
                      variant={retweetSchedule.weekdays.includes(day.value) ? "default" : "outline"}
                      onClick={() => toggleWeekday('retweet', day.value)}
                    >
                      {day.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ 注意</strong><br />
                  1日の投稿・リツイート上限は合計17件です。<br />
                  スケジュールは控えめに設定してください。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          スケジュール設定を保存
        </Button>
      </div>
    </div>
  )
}