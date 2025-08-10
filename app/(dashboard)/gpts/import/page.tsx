'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CheckCircle, Copy, AlertCircle, Upload } from 'lucide-react'

// GPTsから受け取る想定のJSONフォーマット
interface GPTsImportData {
  content: string
  platform: 'x' | 'note' | 'wordpress'
  metadata?: {
    title?: string
    tags?: string[]
    category?: string
    generatedBy?: string
    model?: string
    prompt?: string
  }
  scheduling?: {
    scheduledFor?: string
    timezone?: string
    repeat?: 'none' | 'daily' | 'weekly' | 'monthly'
  }
}

export default function GPTsImportPage() {
  const [jsonInput, setJsonInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [parsedData, setParsedData] = useState<GPTsImportData | null>(null)
  const router = useRouter()

  // サンプルJSONを生成
  const generateSampleJson = () => {
    const sampleData: GPTsImportData = {
      content: "AIの進化により、コンテンツ制作の効率性が大幅に向上しています。GPTsを活用することで、質の高い記事を短時間で作成できるようになりました。#AI #GPTs #コンテンツ制作",
      platform: "x",
      metadata: {
        title: "AI活用コンテンツ制作",
        tags: ["AI", "GPTs", "コンテンツ制作"],
        category: "テクノロジー",
        generatedBy: "GPTs Assistant",
        model: "gpt-4",
        prompt: "AI技術を活用したコンテンツ制作について280文字以内でSNS投稿を作成してください"
      },
      scheduling: {
        scheduledFor: new Date(Date.now() + 3600000).toISOString(), // 1時間後
        timezone: "Asia/Tokyo",
        repeat: "none"
      }
    }
    return JSON.stringify(sampleData, null, 2)
  }

  // JSONをクリップボードにコピー
  const copySampleToClipboard = () => {
    const sample = generateSampleJson()
    navigator.clipboard.writeText(sample)
    setSuccess('サンプルJSONをクリップボードにコピーしました')
    setTimeout(() => setSuccess(''), 3000)
  }

  // JSON入力の解析
  const parseJsonInput = () => {
    try {
      const parsed = JSON.parse(jsonInput)
      
      // 必須フィールドの検証
      if (!parsed.content || !parsed.platform) {
        throw new Error('content と platform は必須フィールドです')
      }
      
      // プラットフォームの検証
      if (!['x', 'note', 'wordpress'].includes(parsed.platform)) {
        throw new Error('platform は x, note, wordpress のいずれかである必要があります')
      }
      
      // 文字数制限の検証
      const maxLengths = { x: 280, note: 3000, wordpress: 5000 }
      if (parsed.content.length > maxLengths[parsed.platform]) {
        throw new Error(`${parsed.platform} の文字数制限 (${maxLengths[parsed.platform]}文字) を超えています`)
      }
      
      setParsedData(parsed)
      setError('')
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'JSONの形式が正しくありません')
      setParsedData(null)
      return false
    }
  }

  // コンテンツの保存
  const handleImport = async () => {
    if (!parsedData) {
      if (!parseJsonInput()) return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      const supabase = createClient()
      
      // データベースに保存
      const { data, error: saveError } = await supabase
        .from('scheduled_posts')
        .insert({
          content: parsedData!.content,
          platform: parsedData!.platform,
          scheduled_for: parsedData!.scheduling?.scheduledFor || null,
          status: parsedData!.scheduling?.scheduledFor ? 'pending' : 'draft',
          metadata: {
            ...parsedData!.metadata,
            source: 'gpts_import',
            importedAt: new Date().toISOString(),
            manualImport: true
          }
        })
        .select()
        .single()
      
      if (saveError) {
        throw new Error(`保存に失敗しました: ${saveError.message}`)
      }
      
      setSuccess(`コンテンツが正常にインポートされました！ID: ${data.id}`)
      setJsonInput('')
      setParsedData(null)
      
      // 3秒後に投稿管理画面に遷移
      setTimeout(() => {
        router.push('/dashboard/scheduled-posts')
      }, 3000)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'インポートに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">GPTs コンテンツインポート</h1>
          <p className="text-muted-foreground mt-2">
            GPTsで生成されたコンテンツをJSONフォーマットで手動インポートできます
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* インポート機能 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                コンテンツインポート
              </CardTitle>
              <CardDescription>
                GPTsで生成されたJSONをここに貼り付けてインポートしてください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  JSON データ
                </label>
                <Textarea
                  placeholder="GPTsで生成されたJSONデータをここに貼り付け..."
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {parsedData && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">プレビュー:</h4>
                  <p className="text-sm mb-2">
                    <strong>プラットフォーム:</strong> {parsedData.platform.toUpperCase()}
                  </p>
                  <p className="text-sm mb-2">
                    <strong>コンテンツ:</strong> {parsedData.content.substring(0, 100)}
                    {parsedData.content.length > 100 ? '...' : ''}
                  </p>
                  <p className="text-sm">
                    <strong>文字数:</strong> {parsedData.content.length}文字
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={parseJsonInput}
                  variant="outline"
                  disabled={!jsonInput.trim()}
                >
                  JSON検証
                </Button>
                <Button 
                  onClick={handleImport}
                  disabled={isLoading || !jsonInput.trim()}
                >
                  {isLoading ? 'インポート中...' : 'インポート'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* サンプルJSON */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Copy className="w-5 h-5" />
                JSONフォーマット例
              </CardTitle>
              <CardDescription>
                GPTsで使用するJSONフォーマットの例です
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Button 
                  onClick={copySampleToClipboard}
                  variant="outline" 
                  size="sm"
                  className="mb-3"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  サンプルをコピー
                </Button>
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-[300px]">
                  {generateSampleJson()}
                </pre>
              </div>

              <div className="space-y-2 text-sm">
                <h4 className="font-medium">フィールド説明:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li><strong>content:</strong> 投稿内容（必須）</li>
                  <li><strong>platform:</strong> x | note | wordpress（必須）</li>
                  <li><strong>metadata:</strong> タイトル、タグなどの追加情報</li>
                  <li><strong>scheduling:</strong> スケジュール設定</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 使い方ガイド */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>使い方</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">1. GPTsでコンテンツ生成</h4>
                <p className="text-sm text-muted-foreground">
                  GPTsに「上記のJSONフォーマットでコンテンツを生成してください」と指示
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">2. JSONをコピー</h4>
                <p className="text-sm text-muted-foreground">
                  生成されたJSONをコピーして左のテキストエリアに貼り付け
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">3. 検証とインポート</h4>
                <p className="text-sm text-muted-foreground">
                  「JSON検証」ボタンで内容を確認後、「インポート」で保存
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">4. 投稿管理</h4>
                <p className="text-sm text-muted-foreground">
                  インポートされたコンテンツは投稿管理画面で確認・編集可能
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}