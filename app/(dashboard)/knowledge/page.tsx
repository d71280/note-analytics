'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Brain, Upload, FileText, Video, Hash, Loader2, CheckCircle2, Sparkles } from 'lucide-react'

interface KnowledgeItem {
  title: string
  content: string
  contentType: string
  tags: string[]
  sourceUrl?: string
}

export default function KnowledgePage() {
  const [uploadType, setUploadType] = useState<'text' | 'file'>('text')
  const [contentType, setContentType] = useState('blog')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [generatedTweet, setGeneratedTweet] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async () => {
    if (!title || !content) return

    setIsUploading(true)
    setUploadSuccess(false)

    try {
      const response = await fetch('/api/knowledge/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          contentType,
          tags: tags.split(',').map(t => t.trim()).filter(t => t),
          sourceUrl: sourceUrl || undefined
        })
      })

      if (response.ok) {
        setUploadSuccess(true)
        // フォームをクリア
        setTitle('')
        setContent('')
        setTags('')
        setSourceUrl('')
        setTimeout(() => setUploadSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result as string
      setContent(text)
      setTitle(file.name.replace(/\.[^/.]+$/, '')) // 拡張子を除いたファイル名
    }
    reader.readAsText(file)
  }

  const generateTweetFromKnowledge = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/knowledge/generate-tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'noteのトレンドに関連する有益な情報をツイート',
          useKnowledge: true
        })
      })

      const data = await response.json()
      if (data.tweet) {
        setGeneratedTweet(data.tweet)
      }
    } catch (error) {
      console.error('Generate error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const contentTypeIcons = {
    blog: <FileText className="h-4 w-4" />,
    video_transcript: <Video className="h-4 w-4" />,
    note: <FileText className="h-4 w-4" />,
    tweet: <Hash className="h-4 w-4" />,
    other: <FileText className="h-4 w-4" />
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Brain className="h-8 w-8" />
        知識ベース管理
      </h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* アップロードセクション */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              コンテンツをアップロード
            </CardTitle>
            <CardDescription>
              ブログ記事、動画の文字起こし、過去のツイートなどを知識ベースに追加
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={uploadType === 'text' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUploadType('text')}
                >
                  テキスト入力
                </Button>
                <Button
                  variant={uploadType === 'file' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUploadType('file')}
                >
                  ファイルアップロード
                </Button>
              </div>

              <div>
                <Label>コンテンツタイプ</Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blog">
                      <div className="flex items-center gap-2">
                        {contentTypeIcons.blog}
                        ブログ記事
                      </div>
                    </SelectItem>
                    <SelectItem value="video_transcript">
                      <div className="flex items-center gap-2">
                        {contentTypeIcons.video_transcript}
                        動画文字起こし
                      </div>
                    </SelectItem>
                    <SelectItem value="note">
                      <div className="flex items-center gap-2">
                        {contentTypeIcons.note}
                        noteの記事
                      </div>
                    </SelectItem>
                    <SelectItem value="tweet">
                      <div className="flex items-center gap-2">
                        {contentTypeIcons.tweet}
                        過去のツイート
                      </div>
                    </SelectItem>
                    <SelectItem value="other">
                      <div className="flex items-center gap-2">
                        {contentTypeIcons.other}
                        その他
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">タイトル</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例: AIを活用した開発効率化の手法"
                  className="mt-1"
                />
              </div>

              {uploadType === 'text' ? (
                <div>
                  <Label htmlFor="content">コンテンツ</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="記事の本文、動画の文字起こし、ツイートなどを入力..."
                    rows={10}
                    className="mt-1"
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="file">ファイル選択</Label>
                  <Input
                    ref={fileInputRef}
                    id="file"
                    type="file"
                    accept=".txt,.md,.json"
                    onChange={handleFileUpload}
                    className="mt-1"
                  />
                  {content && (
                    <p className="text-sm text-gray-600 mt-2">
                      ファイルを読み込みました（{content.length}文字）
                    </p>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="tags">タグ（カンマ区切り）</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="例: AI, 開発, 効率化, TypeScript"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="sourceUrl">ソースURL（オプション）</Label>
                <Input
                  id="sourceUrl"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://example.com/article"
                  className="mt-1"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isUploading || !title || !content}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    アップロード中...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    知識ベースに追加
                  </>
                )}
              </Button>

              {uploadSuccess && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm">正常にアップロードされました</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI生成セクション */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              知識ベースからツイート生成
            </CardTitle>
            <CardDescription>
              蓄積された知識を活用して、あなたらしいツイートを生成します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium mb-2">知識ベースの活用例</h4>
                <ul className="text-sm space-y-1 text-blue-800">
                  <li>• 過去のブログ記事から関連情報を抽出</li>
                  <li>• 動画で話した内容を要約してツイート</li>
                  <li>• あなたの文体や専門知識を反映</li>
                  <li>• 一貫性のあるメッセージを発信</li>
                </ul>
              </div>

              <Button
                onClick={generateTweetFromKnowledge}
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
                    知識ベースからツイートを生成
                  </>
                )}
              </Button>

              {generatedTweet && (
                <div className="space-y-2">
                  <Label>生成されたツイート</Label>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{generatedTweet}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      文字数: {generatedTweet.length}/280
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedTweet)
                      alert('クリップボードにコピーしました')
                    }}
                  >
                    コピー
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 統計情報 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>知識ベース統計</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-gray-600">総コンテンツ数</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-gray-600">ブログ記事</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-gray-600">動画文字起こし</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-gray-600">過去のツイート</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}