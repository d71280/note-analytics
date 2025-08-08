'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkles, Loader2, Plus, Clock, X, Check, Twitter, FileText, Globe, Settings, Zap, Database } from 'lucide-react'
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
    usedKnowledgeCount?: number
    knowledgeSources?: Array<{
      title: string
      contentType: string
      relevance: string
    }>
  }
}


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
                  <div className="mt-2 text-xs text-gray-600">
                    <p className="font-medium mb-1">💡 効果的なプロンプト例:</p>
                    <ul className="space-y-1">
                      <li>• {"脳内OS強化の具体的なステップを3つ教えて"}</li>
                      <li>• {"AI活用で生産性を向上させる実践的な方法"}</li>
                      <li>• {"マーケティング成功事例から学ぶ3つのポイント"}</li>
                      <li>• {"リーダーシップ開発のための日々の習慣"}</li>
                      <li>• {"デジタルマーケティングの最新トレンドと実践法"}</li>
                    </ul>
                  </div>
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
                          <Select value={generationStyle} onValueChange={(value) => setGenerationStyle(value as 'professional' | 'casual' | 'educational' | 'entertaining')}>
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
                          <Select value={generationTone} onValueChange={(value) => setGenerationTone(value as 'formal' | 'friendly' | 'authoritative' | 'conversational')}>
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
                          <Select value={contentType} onValueChange={(value) => setContentType(value as 'summary' | 'analysis' | 'tutorial' | 'opinion' | 'news')}>
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
                <div className="space-y-4">
                  {generatedContents.map((content) => (
                    <Card key={content.id} className="relative">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            {content.platform === 'x' && <Twitter className="h-4 w-4 text-blue-400" />}
                            {content.platform === 'note' && <FileText className="h-4 w-4 text-green-400" />}
                            {content.platform === 'wordpress' && <Globe className="h-4 w-4 text-purple-400" />}
                            <span className="text-sm font-medium">
                              {content.metadata?.style} / {content.metadata?.tone}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleContentSelection(content.id)}
                            >
                              {content.selected ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <div className="h-4 w-4 border-2 border-gray-300 rounded" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteContent(content.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-700 mb-3">{content.content}</p>
                        
                        {/* 知識ベース活用状況の表示 */}
                        {content.metadata?.usedKnowledgeCount && content.metadata.usedKnowledgeCount > 0 && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Database className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">
                                知識ベース活用状況
                              </span>
                            </div>
                            <div className="text-xs text-blue-700">
                              <p>• 使用された知識: {content.metadata.usedKnowledgeCount}件</p>
                              <p>• 生成モデル: {content.metadata.model}</p>
                              <p>• 生成時間: {content.metadata.generationTime}ms</p>
                            </div>
                            
                            {/* 知識ソースの詳細表示 */}
                            {content.metadata.knowledgeSources && content.metadata.knowledgeSources.length > 0 && (
                              <details className="mt-2">
                                <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                                  使用された知識の詳細を見る
                                </summary>
                                <div className="mt-2 space-y-1">
                                  {content.metadata.knowledgeSources.slice(0, 3).map((source, idx) => (
                                    <div key={idx} className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
                                      <p className="font-medium">{source.title}</p>
                                      <p className="text-blue-600">タイプ: {source.contentType}</p>
                                    </div>
                                  ))}
                                  {content.metadata.knowledgeSources.length > 3 && (
                                    <p className="text-xs text-blue-600">
                                      他 {content.metadata.knowledgeSources.length - 3}件の知識を使用
                                    </p>
                                  )}
                                </div>
                              </details>
                            )}
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                          <span>{content.content.length}文字</span>
                          <span>生成時間: {content.metadata?.generationTime || 0}ms</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}