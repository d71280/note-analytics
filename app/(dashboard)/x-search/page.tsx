'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkles, Loader2, Plus, Clock, Send, X, Grip, Check, Twitter, FileText, Globe } from 'lucide-react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

interface GeneratedContent {
  id: string
  content: string
  selected: boolean
  order?: number
  platform: 'x' | 'note' | 'wordpress'
}

interface IntervalOption {
  value: number
  label: string
}

const intervalOptions: IntervalOption[] = [
  { value: 5, label: '5分' },
  { value: 15, label: '15分' },
  { value: 30, label: '30分' },
  { value: 60, label: '1時間' },
  { value: 180, label: '3時間' },
]

const defaultPlatformConfig = {
  x: {
    name: 'X (Twitter)',
    icon: Twitter,
    maxLength: 260, // 280文字制限より少し短くして余裕を持たせる
    placeholder: 'ツイート内容を入力...',
    generatePrompt: '知識ベースから価値のあるツイートを生成してください。必ず260文字以内でまとめてください。'
  },
  note: {
    name: 'Note',
    icon: FileText,
    maxLength: 2000,
    placeholder: 'Note記事の要約や導入文を入力...',
    generatePrompt: '知識ベースからNoteの記事要約や導入文を生成してください'
  },
  wordpress: {
    name: 'WordPress',
    icon: Globe,
    maxLength: 1000,
    placeholder: 'ブログ記事の抜粋や要約を入力...',
    generatePrompt: '知識ベースからWordPressブログの抜粋を生成してください'
  }
}

export default function ContentGenerationPage() {
  const [activeTab, setActiveTab] = useState<'x' | 'note' | 'wordpress'>('x')
  const [prompt, setPrompt] = useState('')
  const [generatedContents, setGeneratedContents] = useState<GeneratedContent[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedInterval, setSelectedInterval] = useState(30)
  const [isScheduling, setIsScheduling] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [platformConfig, setPlatformConfig] = useState(defaultPlatformConfig)
  const [generateCount, setGenerateCount] = useState(5)
  
  const generateContents = async () => {
    setIsGenerating(true)
    try {
      const contentsToGenerate = generateCount
      const newContents: GeneratedContent[] = []
      const config = platformConfig[activeTab]
      
      for (let i = 0; i < contentsToGenerate; i++) {
        const response = await fetch('/api/knowledge/generate-tweet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: prompt || config.generatePrompt,
            platform: activeTab,
            maxLength: config.maxLength,
            index: i
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.tweet) {
            newContents.push({
              id: `content-${Date.now()}-${i}`,
              content: data.tweet,
              selected: false,
              platform: activeTab
            })
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          console.error('Generate tweet API error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData.error,
            details: errorData.details,
            message: errorData.message,
            fullResponse: errorData
          })
          
          // より詳細なエラーメッセージを表示
          let userMessage = 'コンテンツ生成に失敗しました'
          if (response.status === 429) {
            userMessage = 'API制限に達しました。しばらく待ってから再試行してください。'
          } else if (response.status >= 500) {
            userMessage = 'サーバーエラーが発生しました。しばらく待ってから再試行してください。'
          } else if (errorData.message || errorData.error) {
            userMessage = errorData.message || errorData.error
          }
          
          alert(userMessage)
          console.warn(`Stopping generation after error on attempt ${i + 1}/${contentsToGenerate}`)
          break // エラーが発生したら生成を中止
        }
        
        // API制限を避けるため少し待機
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      setGeneratedContents([...generatedContents, ...newContents])
    } catch (error) {
      console.error('Generate contents error:', error)
      alert('コンテンツ生成に失敗しました')
    } finally {
      setIsGenerating(false)
    }
  }
  
  const toggleContentSelection = (id: string) => {
    setGeneratedContents(contents => 
      contents.map(content => {
        if (content.id === id) {
          const newSelected = !content.selected
          const selectedCount = contents.filter(c => c.id !== id && c.selected && c.platform === content.platform).length
          return {
            ...content,
            selected: newSelected,
            order: newSelected ? selectedCount + 1 : undefined
          }
        }
        // 選択解除時は順番を再計算
        if (!contents.find(c => c.id === id)?.selected) {
          const currentOrder = content.order
          const contentToUnselect = contents.find(c => c.id === id)
          if (currentOrder && contentToUnselect && content.platform === contentToUnselect.platform && currentOrder > (contentToUnselect.order || 0)) {
            return { ...content, order: currentOrder - 1 }
          }
        }
        return content
      })
    )
  }
  
  const handleDragEnd = (result: { destination: { index: number } | null, source: { index: number } }) => {
    if (!result.destination) return
    
    const items = Array.from(generatedContents)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)
    
    setGeneratedContents(items)
  }
  
  const addCustomContent = () => {
    if (!customPrompt.trim()) return
    
    const config = platformConfig[activeTab]
    if (customPrompt.length > config.maxLength) {
      alert(`${config.name}の最大文字数は${config.maxLength}文字です`)
      return
    }
    
    const newContent: GeneratedContent = {
      id: `custom-${Date.now()}`,
      content: customPrompt,
      selected: false,
      platform: activeTab
    }
    
    setGeneratedContents([...generatedContents, newContent])
    setCustomPrompt('')
  }
  
  const deleteContent = (id: string) => {
    setGeneratedContents(contents => {
      const contentToDelete = contents.find(c => c.id === id)
      const wasSelected = contentToDelete?.selected
      const orderToDelete = contentToDelete?.order
      const platform = contentToDelete?.platform
      
      return contents
        .filter(content => content.id !== id)
        .map(content => {
          if (wasSelected && content.order && orderToDelete && content.platform === platform && content.order > orderToDelete) {
            return { ...content, order: content.order - 1 }
          }
          return content
        })
    })
  }
  
  const scheduleSelectedContents = async () => {
    const selectedContents = generatedContents
      .filter(content => content.selected && content.platform === activeTab)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
    
    if (selectedContents.length === 0) {
      alert('投稿するコンテンツを選択してください')
      return
    }
    
    setIsScheduling(true)
    try {
      const response = await fetch('/api/x/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tweets: selectedContents.map(content => content.content),
          interval: selectedInterval,
          platform: activeTab
        })
      })
      
      if (response.ok) {
        alert(`${selectedContents.length}件の${platformConfig[activeTab].name}投稿を${selectedInterval}分間隔でスケジュールしました`)
        // 選択されたコンテンツを削除
        setGeneratedContents(contents => contents.filter(content => !(content.selected && content.platform === activeTab)))
      } else {
        throw new Error('Schedule failed')
      }
    } catch (error) {
      console.error('Schedule error:', error)
      alert('スケジュール設定に失敗しました')
    } finally {
      setIsScheduling(false)
    }
  }
  
  const currentPlatformContents = generatedContents.filter(content => content.platform === activeTab)
  const selectedCount = currentPlatformContents.filter(content => content.selected).length
  const config = platformConfig[activeTab]
  const Icon = config.icon
  
  const updateMaxLength = (platform: 'x' | 'note' | 'wordpress', newLength: number) => {
    setPlatformConfig(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        maxLength: newLength
      }
    }))
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">コンテンツ生成&配信</h1>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'x' | 'note' | 'wordpress')}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="x" className="flex items-center gap-2">
            <Twitter className="h-4 w-4" />
            X (Twitter)
          </TabsTrigger>
          <TabsTrigger value="note" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Note
          </TabsTrigger>
          <TabsTrigger value="wordpress" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            WordPress
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          {/* コンテンツ生成セクション */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="h-5 w-5" />
                {config.name}コンテンツ生成
              </CardTitle>
              <CardDescription>
                知識ベースとプロンプトから複数の{config.name}コンテンツを生成します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prompt">生成プロンプト（オプション）</Label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={`例: ${activeTab === 'x' ? '最新のAI技術について、実用的なヒントを...' : 
                      activeTab === 'note' ? '技術記事の要約を魅力的に...' : 
                      'SEOを意識したブログ記事の抜粋を...'}`}
                    rows={3}
                    className="mt-2"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="maxLength">文字数制限</Label>
                    <Input
                      id="maxLength"
                      type="number"
                      value={config.maxLength}
                      onChange={(e) => updateMaxLength(activeTab, parseInt(e.target.value) || 100)}
                      min="50"
                      max="5000"
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {activeTab === 'x' ? '推奨: 280文字' : 
                       activeTab === 'note' ? '推奨: 500-2000文字' : 
                       '推奨: 150-1000文字'}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="generateCount">生成件数</Label>
                    <Select
                      value={generateCount.toString()}
                      onValueChange={(value) => setGenerateCount(parseInt(value))}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1件</SelectItem>
                        <SelectItem value="3">3件</SelectItem>
                        <SelectItem value="5">5件</SelectItem>
                        <SelectItem value="10">10件</SelectItem>
                        <SelectItem value="20">20件</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={generateContents}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {generateCount}件のコンテンツを生成
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          
          {/* カスタムコンテンツ追加 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                カスタムコンテンツ追加
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder={config.placeholder}
                  rows={3}
                  className="flex-1"
                  maxLength={config.maxLength}
                />
                <Button
                  onClick={addCustomContent}
                  disabled={!customPrompt.trim()}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {customPrompt.length}/{config.maxLength}文字
              </p>
            </CardContent>
          </Card>
          
          {/* 生成されたコンテンツ一覧 */}
          {currentPlatformContents.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>生成されたコンテンツ</span>
                  {selectedCount > 0 && (
                    <span className="text-sm font-normal text-gray-500">
                      {selectedCount}件選択中
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  投稿したいコンテンツを選択して、ドラッグで順番を変更できます
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="contents">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-3"
                      >
                        {currentPlatformContents.map((content, index) => (
                          <Draggable key={content.id} draggableId={content.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`
                                  p-4 rounded-lg border transition-all
                                  ${content.selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                                  ${snapshot.isDragging ? 'shadow-lg' : ''}
                                `}
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    {...provided.dragHandleProps}
                                    className="mt-1 cursor-move text-gray-400"
                                  >
                                    <Grip className="h-5 w-5" />
                                  </div>
                                  
                                  <button
                                    onClick={() => toggleContentSelection(content.id)}
                                    className={`
                                      mt-1 w-5 h-5 rounded border-2 flex items-center justify-center
                                      ${content.selected 
                                        ? 'bg-blue-500 border-blue-500' 
                                        : 'border-gray-300 hover:border-gray-400'
                                      }
                                    `}
                                  >
                                    {content.selected && (
                                      <Check className="h-3 w-3 text-white" />
                                    )}
                                  </button>
                                  
                                  <div className="flex-1">
                                    <p className="text-sm whitespace-pre-wrap">{content.content}</p>
                                    <p className="text-xs text-gray-500 mt-2">
                                      {content.content.length}/{config.maxLength}文字
                                      {content.order && (
                                        <span className="ml-2 font-semibold text-blue-600">
                                          投稿順: {content.order}
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                  
                                  <button
                                    onClick={() => deleteContent(content.id)}
                                    className="text-gray-400 hover:text-red-500"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </CardContent>
            </Card>
          )}
          
          {/* スケジュール設定 */}
          {selectedCount > 0 && (
            <Card className="sticky bottom-4 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <div>
                      <Label htmlFor="interval" className="text-sm">投稿間隔</Label>
                      <Select
                        value={selectedInterval.toString()}
                        onValueChange={(value) => setSelectedInterval(parseInt(value))}
                      >
                        <SelectTrigger id="interval" className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {intervalOptions.map(option => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-sm text-gray-600">
                      {selectedCount}件の{config.name}投稿を{selectedInterval}分間隔で配信
                    </p>
                  </div>
                  
                  <Button
                    onClick={scheduleSelectedContents}
                    disabled={isScheduling}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isScheduling ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        スケジュール中...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        スケジュール投稿
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}