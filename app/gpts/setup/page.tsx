'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, Copy, ExternalLink, Zap, Settings, Code, Key } from 'lucide-react'

export default function GPTsSetupPage() {
  const [copiedItem, setCopiedItem] = useState<string | null>(null)
  const schemaUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://note-analytics-platform.vercel.app'}/api/gpts/schema`
  const testApiKey = 'test-api-key-12345'

  const copyToClipboard = (text: string, item: string) => {
    navigator.clipboard.writeText(text)
    setCopiedItem(item)
    setTimeout(() => setCopiedItem(null), 2000)
  }

  const gptInstructions = `あなたはnoteプラットフォーム向けのコンテンツ生成アシスタントです。

主な機能：
1. ユーザーのリクエストに基づいてnote記事を生成
2. 生成したコンテンツを自動的にNote Analytics Platformに送信
3. スケジュール投稿の設定サポート

コンテンツ生成時の注意点：
- noteは最大3000文字まで
- X（Twitter）は280文字まで
- タイトル、タグ、カテゴリーを適切に設定
- 読みやすく、価値のあるコンテンツを生成

自動送信プロセス：
1. コンテンツ生成後、必ずsendContent actionを使用して送信
2. 送信成功時はcontentIdとwebUrlをユーザーに通知
3. エラー時は適切なエラーメッセージを表示`

  const samplePrompts = [
    {
      title: '基本的なコンテンツ生成',
      prompt: '「AIとクリエイティビティの未来」というテーマでnote記事を生成して、自動送信してください。タグは #AI #クリエイティブ #テクノロジー を付けてください。',
    },
    {
      title: 'スケジュール投稿',
      prompt: '「リモートワークの生産性向上術」についての記事を生成して、明日の10時に投稿するようスケジュールしてください。',
    },
    {
      title: '複数プラットフォーム',
      prompt: '「Web3.0の可能性」について、note用の詳細記事（2000文字）とX用の要約（280文字）を生成して送信してください。',
    },
  ]

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">GPTs Actions 自動送信設定</h1>
        <p className="text-muted-foreground">
          GPTsから自動的にコンテンツを受信できるように設定します
        </p>
      </div>

      <Alert className="mb-6">
        <Zap className="h-4 w-4" />
        <AlertDescription>
          この設定により、GPTsで生成したコンテンツが自動的にNote Analytics Platformに送信され、
          スケジュール投稿や複数プラットフォームへの配信が可能になります。
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="quick" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quick">クイックセットアップ</TabsTrigger>
          <TabsTrigger value="detailed">詳細手順</TabsTrigger>
          <TabsTrigger value="test">テスト＆サンプル</TabsTrigger>
        </TabsList>

        <TabsContent value="quick" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>3ステップで設定完了</CardTitle>
              <CardDescription>
                以下の情報をGPTsビルダーにコピー＆ペーストするだけで設定できます
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge className="mt-1">1</Badge>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold">OpenAPI Schema URL</h3>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-muted p-2 rounded text-sm">
                        {schemaUrl}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(schemaUrl, 'schema')}
                      >
                        {copiedItem === 'schema' ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge className="mt-1">2</Badge>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold">Authentication</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Type</p>
                        <code className="bg-muted p-2 rounded text-sm block">API Key</code>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Header</p>
                        <code className="bg-muted p-2 rounded text-sm block">x-api-key</code>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge className="mt-1">3</Badge>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold">API Key (テスト用)</h3>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-muted p-2 rounded text-sm">
                        {testApiKey}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(testApiKey, 'apikey')}
                      >
                        {copiedItem === 'apikey' ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button asChild className="w-full">
                  <a
                    href="https://chat.openai.com/gpts/editor"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GPTsビルダーを開く
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <Settings className="inline-block mr-2 h-5 w-5" />
                GPT基本設定
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Name（名前）</h3>
                <code className="bg-muted p-2 rounded text-sm block">
                  Note Content Generator
                </code>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Description（説明）</h3>
                <code className="bg-muted p-2 rounded text-sm block">
                  noteプラットフォーム向けのコンテンツを生成し、自動的にNote Analytics Platformに送信します。
                </code>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Instructions（指示）</h3>
                <div className="relative">
                  <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                    {gptInstructions}
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(gptInstructions, 'instructions')}
                  >
                    {copiedItem === 'instructions' ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <Code className="inline-block mr-2 h-5 w-5" />
                Actions設定
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  GPTビルダーの「Configure」タブ → 「Create new action」をクリックして以下を設定
                </AlertDescription>
              </Alert>

              <div>
                <h3 className="font-semibold mb-2">1. Import from URL</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  以下のURLをImport欄に貼り付けてください：
                </p>
                <code className="bg-muted p-2 rounded text-sm block">
                  {schemaUrl}
                </code>
              </div>

              <div>
                <h3 className="font-semibold mb-2">2. Authentication設定</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Authentication Type: <code className="bg-muted px-1">API Key</code></li>
                  <li>• API Key: <code className="bg-muted px-1">Custom</code></li>
                  <li>• Header name: <code className="bg-muted px-1">x-api-key</code></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">3. API Key設定</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Configureタブの最下部にあるAPI Key欄に入力：
                </p>
                <code className="bg-muted p-2 rounded text-sm block">
                  {testApiKey}
                </code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>動作確認</CardTitle>
              <CardDescription>
                設定が完了したら、以下のプロンプトでテストしてください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {samplePrompts.map((sample, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{sample.title}</h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(sample.prompt, `prompt-${index}`)}
                      >
                        {copiedItem === `prompt-${index}` ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm bg-muted p-3 rounded">
                      {sample.prompt}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <Key className="inline-block mr-2 h-5 w-5" />
                本番用APIキー
              </CardTitle>
              <CardDescription>
                テストが成功したら、本番用の独自APIキーを生成してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <a href="/settings/api-keys">
                  APIキー管理画面へ
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>トラブルシューティング</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-semibold text-sm mb-1">❌ &quot;Invalid API key&quot; エラー</h3>
                <p className="text-sm text-muted-foreground">
                  Header nameが「x-api-key」になっているか確認してください
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">❌ &quot;Failed to send content&quot; エラー</h3>
                <p className="text-sm text-muted-foreground">
                  URLが正しいか、httpsで始まっているか確認してください
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">❌ Actions が表示されない</h3>
                <p className="text-sm text-muted-foreground">
                  GPTを一度保存してから、再度編集画面を開いてください
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}