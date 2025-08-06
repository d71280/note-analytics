'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw, Twitter, Bug } from 'lucide-react'

interface DebugInfo {
  configs: Array<{
    id: string
    user_id: string
    has_access_token: boolean
    has_bearer_token: boolean
    created_at: string
    updated_at: string
  }>
  current_user: string
  total_configs: number
}

export default function XDebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [postResult, setPostResult] = useState<{ status: number | string; ok: boolean; data: Record<string, unknown> } | null>(null)

  useEffect(() => {
    fetchDebugInfo()
  }, [])

  const fetchDebugInfo = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/x/debug-config')
      const data = await response.json()
      
      if (response.ok) {
        setDebugInfo(data)
      } else {
        setError(data.error || 'デバッグ情報の取得に失敗しました')
      }
    } catch (error) {
      console.error('Failed to fetch debug info:', error)
      setError('デバッグ情報の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const testPost = async () => {
    try {
      const response = await fetch('/api/x/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'テスト投稿 ' + new Date().toLocaleString('ja-JP')
        })
      })
      
      const data = await response.json()
      setPostResult({
        status: response.status,
        ok: response.ok,
        data
      })
    } catch (error) {
      setPostResult({
        status: 'error',
        ok: false,
        data: { error: (error as Error).message }
      })
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Bug className="h-8 w-8" />
        X API デバッグ
      </h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>設定デバッグ情報</span>
            <Button
              onClick={fetchDebugInfo}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              更新
            </Button>
          </CardTitle>
          <CardDescription>
            X API設定の詳細情報とユーザー認証状態を確認します
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          ) : debugInfo ? (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">認証情報</h3>
                <p className="text-sm">
                  <span className="font-medium">現在のユーザーID:</span> {debugInfo.current_user}
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold mb-2">X API設定 ({debugInfo.total_configs}件)</h3>
                {debugInfo.configs.length > 0 ? (
                  <div className="space-y-2">
                    {debugInfo.configs.map((config, index) => (
                      <div key={config.id} className="p-3 bg-white rounded border">
                        <p className="text-sm font-medium">設定 #{index + 1}</p>
                        <p className="text-xs text-gray-600">ID: {config.id}</p>
                        <p className="text-xs text-gray-600">User ID: {config.user_id}</p>
                        <div className="flex gap-4 mt-2">
                          <span className={`text-xs ${config.has_access_token ? 'text-green-600' : 'text-red-600'}`}>
                            Access Token: {config.has_access_token ? '✓' : '✗'}
                          </span>
                          <span className={`text-xs ${config.has_bearer_token ? 'text-green-600' : 'text-red-600'}`}>
                            Bearer Token: {config.has_bearer_token ? '✓' : '✗'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          作成: {new Date(config.created_at).toLocaleString('ja-JP')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">設定が見つかりません</p>
                )}
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <h3 className="font-semibold mb-2">問題の可能性</h3>
                <ul className="text-sm space-y-1 text-yellow-800">
                  {debugInfo.current_user === 'Not authenticated' && (
                    <li>• ユーザーが認証されていません</li>
                  )}
                  {debugInfo.configs.length === 0 && (
                    <li>• X API設定が登録されていません</li>
                  )}
                  {debugInfo.configs.some(c => c.user_id !== debugInfo.current_user) && (
                    <li>• 設定のユーザーIDと現在のユーザーIDが一致しない可能性があります</li>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin opacity-50" />
              <p>読み込み中...</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>投稿テスト</CardTitle>
          <CardDescription>
            実際に投稿をテストして詳細なエラー情報を取得します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={testPost} className="mb-4">
            <Twitter className="h-4 w-4 mr-2" />
            テスト投稿
          </Button>
          
          {postResult && (
            <div className={`p-4 rounded-lg ${postResult.ok ? 'bg-green-50' : 'bg-red-50'}`}>
              <h4 className={`font-semibold mb-2 ${postResult.ok ? 'text-green-900' : 'text-red-900'}`}>
                結果: {postResult.ok ? '成功' : '失敗'}
              </h4>
              <p className="text-sm mb-1">
                ステータスコード: {postResult.status}
              </p>
              <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
                {JSON.stringify(postResult.data, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}