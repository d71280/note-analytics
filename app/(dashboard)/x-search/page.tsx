'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkles, Loader2, Plus, Clock, Send, X, Grip, Check, Twitter, FileText, Globe, Settings, Zap } from 'lucide-react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Switch } from '@/components/ui/switch'

interface GeneratedContent {
  id: string
  content: string
  selected: boolean
  order?: number
  platform: 'x' | 'note' | 'wordpress'
  metadata?: {
    style: string
    tone: string
    contentType: string
    model: string
    generationTime: number
  }
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
    maxLength: 260,
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
  
  // 高度な生成設定
  const [useAdvancedGeneration, setUseAdvancedGeneration] = useState(false)
  const [generationStyle, setGenerationStyle] = useState<'professional' | 'casual' | 'educational' | 'entertaining'>('professional')
  const [generationTone, setGenerationTone] = useState<'formal' | 'friendly' | 'authoritative' | 'conversational'>('friendly')
  const [includeHashtags, setIncludeHashtags] = useState(false)
  const [targetAudience, setTargetAudience] = useState('一般')
  const [contentType, setContentType] = useState<'summary' | 'analysis' | 'tutorial' | 'opinion' | 'news'>('summary')
  
  const generateContents = async () => {
    setIsGenerating(true)
    try {
      const contentsToGenerate = generateCount
      const newContents: GeneratedContent[] = []
      const config = platformConfig[activeTab]
      
      for (let i = 0; i < contentsToGenerate; i++) {
        const endpoint = useAdvancedGeneration ? '/api/knowledge/generate-advanced' : '/api/knowledge/generate-tweet'
        const requestBody = useAdvancedGeneration ? {
          prompt: prompt || config.generatePrompt,
          platform: activeTab,
          maxLength: config.maxLength,
          style: generationStyle,
          tone: generationTone,
          includeHashtags,
          targetAudience,
          contentType,
          index: i
        } : {
          prompt: prompt || config.generatePrompt,
          platform: activeTab,
          maxLength: config.maxLength,
          index: i
        }
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })
        
        if (response.ok) {
          const data = await response.json()
          const content = useAdvancedGeneration ? data.content : data.tweet
          if (content) {
            newContents.push({
              id: `content-${Date.now()}-${i}`,
              content,
              selected: false,
              platform: activeTab,
              metadata: useAdvancedGeneration ? {
                style: generationStyle,
                tone: generationTone,
                contentType,
                model: data.metadata?.model || 'unknown',
                generationTime: data.metadata?.generationTime || 0
              } : undefined
            })
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          console.error(`Generation ${i + 1} failed:`, errorData)
        }
      }
      
      setGeneratedContents(prev => [...prev, ...newContents])
    } catch (error) {
      console.error('Generation error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleContentSelection = (id: string) => {
    setGeneratedContents(prev =>
      prev.map(content =>
        content.id === id
          ? { ...content, selected: !content.selected }
          : content
      )
    )
  }

  const selectAllContents = () => {
    setGeneratedContents(prev =>
      prev.map(content => ({ ...content, selected: true }))
    )
  }

  const deselectAllContents = () => {
    setGeneratedContents(prev =>
      prev.map(content => ({ ...content, selected: false }))
    )
  }

  const handleDragEnd = (result: { destination: { index: number } | null, source: { index: number } }) => {
    if (!result.destination) return

    const items = Array.from(generatedContents)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setGeneratedContents(items.map((item, index) => ({ ...item, order: index })))
  }

  const addCustomContent = () => {
    if (!customPrompt.trim()) return

    const newContent: GeneratedContent = {
      id: `custom-${Date.now()}`,
      content: customPrompt,
      selected: false,
      platform: activeTab
    }

    setGeneratedContents(prev => [...prev, newContent])
    setCustomPrompt('')
  }

  const deleteContent = (id: string) => {
    setGeneratedContents(prev => prev.filter(content => content.id !== id))
  }

  const scheduleSelectedContents = async () => {
    const selectedContents = generatedContents.filter(content => content.selected)
    if (selectedContents.length === 0) {
      alert('投稿するコンテンツを選択してください')
      return
    }

    setIsScheduling(true)
    try {
      // スケジューリングの実装（後で追加）
      console.log('Scheduling contents:', selectedContents)
      alert(`${selectedContents.length}件のコンテンツをスケジュールしました`)
    } catch (error) {
      console.error('Scheduling error:', error)
      alert('スケジューリング中にエラーが発生しました')
    } finally {
      setIsScheduling(false)
    }
  }

  const updateMaxLength = (platform: 'x' | 'note' | 'wordpress', newLength: number) => {
    setPlatformConfig(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        maxLength: newLength
      }
    }))
  }

  const selectedCount = generatedContents.filter(content => content.selected).length

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8" />
          コンテンツ生成&配信
        </h1>
        <p className="text-gray-600 mt-2">
          知識ベースとプロンプトから複数のコンテンツを生成し、各プラットフォームに配信します
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'x' | 'note' | 'wordpress')}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="x" className="flex items-center gap-2">
            <Check className="h-4 w-4" />
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

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 生成設定 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {platformConfig[activeTab].name}コンテンツ生成
                </CardTitle>
                <CardDescription>
                  知識ベースとプロンプトから複数の{platformConfig[activeTab].name}コンテンツを生成します
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="prompt">生成プロンプト (オプション)</Label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={`例: 最新のAI技術について、実用的なヒントを...`}
                    className="mt-2"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxLength">文字数制限</Label>
                    <Input
                      id="maxLength"
                      type="number"
                      value={platformConfig[activeTab].maxLength}
                      onChange={(e) => updateMaxLength(activeTab, parseInt(e.target.value))}
                      className="mt-2"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      推奨: {activeTab === 'x' ? '280' : activeTab === 'note' ? '2000' : '1000'}文字
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="generateCount">生成件数</Label>
                    <Select value={generateCount.toString()} onValueChange={(value) => setGenerateCount(parseInt(value))}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1件</SelectItem>
                        <SelectItem value="3">3件</SelectItem>
                        <SelectItem value="5">5件</SelectItem>
                        <SelectItem value="10">10件</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 高度な生成設定 */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-sm font-medium">高度な生成設定</Label>
                    <Switch
                      checked={useAdvancedGeneration}
                      onCheckedChange={setUseAdvancedGeneration}
                    />
                  </div>
                  
                  {useAdvancedGeneration && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="style">スタイル</Label>
                          <Select value={generationStyle} onValueChange={(value: any) => setGenerationStyle(value)}>
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="professional">専門的</SelectItem>
                              <SelectItem value="casual">カジュアル</SelectItem>
                              <SelectItem value="educational">教育的</SelectItem>
                              <SelectItem value="entertaining">エンターテイメント</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="tone">トーン</Label>
                          <Select value={generationTone} onValueChange={(value: any) => setGenerationTone(value)}>
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="formal">フォーマル</SelectItem>
                              <SelectItem value="friendly">フレンドリー</SelectItem>
                              <SelectItem value="authoritative">権威的</SelectItem>
                              <SelectItem value="conversational">会話的</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="contentType">コンテンツタイプ</Label>
                          <Select value={contentType} onValueChange={(value: any) => setContentType(value)}>
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="summary">要約</SelectItem>
                              <SelectItem value="analysis">分析</SelectItem>
                              <SelectItem value="tutorial">チュートリアル</SelectItem>
                              <SelectItem value="opinion">意見</SelectItem>
                              <SelectItem value="news">ニュース</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="targetAudience">ターゲット</Label>
                          <Input
                            id="targetAudience"
                            value={targetAudience}
                            onChange={(e) => setTargetAudience(e.target.value)}
                            placeholder="例: 一般, 専門家, 初心者"
                            className="mt-2"
                          />
                        </div>
                      </div>
                      
                      {activeTab === 'x' && (
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="hashtags"
                            checked={includeHashtags}
                            onCheckedChange={setIncludeHashtags}
                          />
                          <Label htmlFor="hashtags">ハッシュタグを含める</Label>
                        </div>
                      )}
                    </div>
                  )}
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
                      <Zap className="mr-2 h-4 w-4" />
                      {generateCount}件のコンテンツを生成
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* カスタムコンテンツ追加 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  カスタムコンテンツ追加
                </CardTitle>
                <CardDescription>
                  手動でコンテンツを追加して、生成されたコンテンツと一緒に管理できます
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customContent">ツイート内容を入力...</Label>
                  <Textarea
                    id="customContent"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="カスタムコンテンツを入力..."
                    className="mt-2"
                    rows={4}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {customPrompt.length}/{platformConfig[activeTab].maxLength}文字
                  </p>
                </div>
                <Button onClick={addCustomContent} disabled={!customPrompt.trim()}>
                  <Plus className="mr-2 h-4 w-4" />
                  追加
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* 生成されたコンテンツ */}
          {generatedContents.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>生成されたコンテンツ ({generatedContents.length}件)</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllContents}>
                      全選択
                    </Button>
                    <Button variant="outline" size="sm" onClick={deselectAllContents}>
                      選択解除
                    </Button>
                    <Button 
                      onClick={scheduleSelectedContents}
                      disabled={selectedCount === 0 || isScheduling}
                      size="sm"
                    >
                      {isScheduling ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          スケジュール中...
                        </>
                      ) : (
                        <>
                          <Clock className="mr-2 h-4 w-4" />
                          {selectedCount}件をスケジュール
                        </>
                      )}
                    </Button>
                  </div>
                </div>
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
                        {generatedContents.map((content, index) => (
                          <Draggable key={content.id} draggableId={content.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`p-4 border rounded-lg ${
                                  content.selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Grip className="h-4 w-4 text-gray-400" {...provided.dragHandleProps} />
                                      <span className="text-sm text-gray-500">
                                        {platformConfig[content.platform].name}
                                      </span>
                                      {content.metadata && (
                                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                          {content.metadata.style} / {content.metadata.tone}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm">{content.content}</p>
                                    {content.metadata && (
                                      <div className="flex gap-2 mt-2 text-xs text-gray-500">
                                        <span>モデル: {content.metadata.model}</span>
                                        <span>生成時間: {content.metadata.generationTime}ms</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex gap-1 ml-4">
                                    <Button
                                      size="sm"
                                      variant={content.selected ? "default" : "outline"}
                                      onClick={() => toggleContentSelection(content.id)}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => deleteContent(content.id)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}