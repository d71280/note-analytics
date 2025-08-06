'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, Twitter, Loader2, TestTube, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface EnvConfig {
  x: {
    configured: boolean
    api_key: string
    api_secret: string
    access_token: string
    access_token_secret: string
  }
}

export default function XSettings() {
  const [envConfig, setEnvConfig] = useState<EnvConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    fetchEnvConfig()
  }, [])

  const fetchEnvConfig = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/config/env', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setEnvConfig(data)
      }
    } catch (error) {
      console.error('Failed to fetch env config:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const testXConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    try {
      const response = await fetch('/api/x/test-connection', {
        method: 'POST',
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setTestResult({
          success: true,
          message: `接続成功！ユーザー: @${data.user.username || data.user.name}`
        })
      } else {
        setTestResult({
          success: false,
          message: `接続失敗: ${data.error}`
        })
      }
    } catch {
      setTestResult({
        success: false,
        message: '接続テストに失敗しました'
      })
    } finally {
      setIsTesting(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Twitter className="h-5 w-5" />
          X（Twitter）API 設定
        </CardTitle>
        <CardDescription>
          環境変数から自動的にX APIの認証情報を読み込みます
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 接続状態 */}
        {envConfig?.x.configured ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            <span>環境変数に設定済み</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            <span>環境変数が設定されていません</span>
          </div>
        )}

        {/* 環境変数の状態 */}
        {envConfig?.x.configured && (
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <h3 className="font-medium text-sm mb-2">設定されている環境変数（マスク表示）</h3>
            <div className="space-y-1 text-sm font-mono">
              <div>X_API_KEY: {envConfig.x.api_key}</div>
              <div>X_API_SECRET: {envConfig.x.api_secret}</div>
              <div>X_ACCESS_TOKEN: {envConfig.x.access_token}</div>
              <div>X_ACCESS_SECRET: {envConfig.x.access_token_secret}</div>
            </div>
          </div>
        )}

        {/* 設定方法の説明 */}
        {!envConfig?.x.configured && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>設定方法:</strong><br />
              Vercelのダッシュボードで以下の環境変数を設定してください：
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>X_API_KEY</li>
                <li>X_API_SECRET または X_API_KEY_SECRET</li>
                <li>X_ACCESS_TOKEN</li>
                <li>X_ACCESS_SECRET</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* テスト結果 */}
        {testResult && (
          <Alert className={testResult.success ? 'border-green-500' : 'border-red-500'}>
            {testResult.success ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription>{testResult.message}</AlertDescription>
          </Alert>
        )}

        {/* アクションボタン */}
        <div className="flex gap-2">
          <Button 
            onClick={testXConnection} 
            disabled={!envConfig?.x.configured || isTesting}
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                テスト中...
              </>
            ) : (
              <>
                <TestTube className="mr-2 h-4 w-4" />
                接続テスト
              </>
            )}
          </Button>
        </div>

        {/* 制限事項 */}
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>注意:</strong> X API Basic tierの制限により、1日の投稿数は17件までです。
          </p>
        </div>
      </CardContent>
    </Card>
  )
}