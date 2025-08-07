'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

interface APITestResult {
  success?: boolean
  error?: string
  details?: string
  keyPreview?: string
  response?: string
  errorDetails?: unknown
  status?: number
  tweet?: string
  model?: string
  message?: string
}

export default function APITestPage() {
  const [grokTest, setGrokTest] = useState<APITestResult | null>(null)
  const [generateTest, setGenerateTest] = useState<APITestResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testGrokAPI = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/debug/grok-test')
      const data = await response.json()
      setGrokTest(data)
    } catch (error) {
      setGrokTest({ error: 'Failed to test API', details: String(error) })
    } finally {
      setIsLoading(false)
    }
  }

  const testGenerateAPI = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/knowledge/generate-tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'テスト',
          platform: 'x',
          maxLength: 280
        })
      })
      const data = await response.json()
      setGenerateTest({ status: response.status, ...data })
    } catch (error) {
      setGenerateTest({ error: 'Failed to test API', details: String(error) })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">API接続テスト</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Grok API接続テスト</CardTitle>
            <CardDescription>
              Grok APIキーが正しく設定されているか確認します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testGrokAPI} 
              disabled={isLoading}
              className="mb-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  テスト中...
                </>
              ) : (
                'Grok APIをテスト'
              )}
            </Button>

            {grokTest && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                {grokTest.success ? (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-700">接続成功</p>
                      <p className="text-sm text-gray-600 mt-1">
                        APIキー: {grokTest.keyPreview}
                      </p>
                      <p className="text-sm text-gray-600">
                        レスポンス: {grokTest.response}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-700">接続失敗</p>
                      <p className="text-sm text-gray-600 mt-1">
                        エラー: {grokTest.error}
                      </p>
                      {grokTest.errorDetails && (
                        <pre className="text-xs mt-2 p-2 bg-red-50 rounded">
                          {JSON.stringify(grokTest.errorDetails, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>コンテンツ生成APIテスト</CardTitle>
            <CardDescription>
              コンテンツ生成APIが正常に動作するか確認します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testGenerateAPI} 
              disabled={isLoading}
              className="mb-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  テスト中...
                </>
              ) : (
                'コンテンツ生成をテスト'
              )}
            </Button>

            {generateTest && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                {generateTest.tweet ? (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-green-700">生成成功</p>
                      <p className="text-sm text-gray-600 mt-2">
                        生成されたコンテンツ:
                      </p>
                      <div className="mt-2 p-3 bg-white border rounded">
                        {generateTest.tweet}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        文字数: {generateTest.tweet.length}文字 | 
                        モデル: {generateTest.model}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-700">生成失敗</p>
                      <p className="text-sm text-gray-600 mt-1">
                        ステータス: {generateTest.status}
                      </p>
                      <p className="text-sm text-gray-600">
                        エラー: {generateTest.error}
                      </p>
                      {generateTest.details && (
                        <p className="text-sm text-gray-600">
                          詳細: {generateTest.details}
                        </p>
                      )}
                      {generateTest.message && (
                        <p className="text-sm text-gray-600">
                          メッセージ: {generateTest.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}