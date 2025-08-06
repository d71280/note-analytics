'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, RefreshCw, Twitter, Key, Shield } from 'lucide-react'

interface XApiConfig {
  id?: string
  api_key?: string
  api_key_secret?: string
  access_token?: string
  access_token_secret?: string
  bearer_token?: string
  created_at?: string
  updated_at?: string
}

export default function XApiCheckPage() {
  const [config, setConfig] = useState<XApiConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkXApiConfig()
  }, [])

  const checkXApiConfig = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // X API設定を取得
      const response = await fetch('/api/x/config')
      const data = await response.json()
      
      if (response.ok && data.config) {
        setConfig(data.config)
      } else {
        setError(data.error || 'X API設定が見つかりません')
      }
    } catch (error) {
      console.error('Failed to fetch X API config:', error)
      setError('X API設定の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const testApiConnection = async () => {
    try {
      const response = await fetch('/api/x/test-connection', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        alert('X API接続テスト成功！')
      } else {
        alert(`X API接続テスト失敗: ${data.error}`)
      }
    } catch (error) {
      alert('接続テストに失敗しました')
    }
  }

  const maskToken = (token: string | undefined) => {
    if (!token) return '未設定'
    if (token.length <= 8) return '***'
    return `${token.substring(0, 4)}...${token.substring(token.length - 4)}`
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Twitter className="h-8 w-8" />
        X API設定確認
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>X API設定状態</span>
            <Button
              onClick={checkXApiConfig}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              更新
            </Button>
          </CardTitle>
          <CardDescription>
            X APIの設定状態とデータベース内の情報を確認します
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          ) : config ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold">API Key:</span>
                    <span className={config.api_key ? 'text-green-600' : 'text-red-600'}>
                      {maskToken(config.api_key)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold">API Key Secret:</span>
                    <span className={config.api_key_secret ? 'text-green-600' : 'text-red-600'}>
                      {maskToken(config.api_key_secret)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold">Access Token:</span>
                    <span className={config.access_token ? 'text-green-600' : 'text-red-600'}>
                      {maskToken(config.access_token)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold">Access Token Secret:</span>
                    <span className={config.access_token_secret ? 'text-green-600' : 'text-red-600'}>
                      {maskToken(config.access_token_secret)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold">Bearer Token:</span>
                    <span className={config.bearer_token ? 'text-green-600' : 'text-red-600'}>
                      {maskToken(config.bearer_token)}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2">設定状態</h3>
                    {config.access_token ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span>X API設定が完了しています</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-yellow-600">
                        <AlertCircle className="h-5 w-5" />
                        <span>一部の設定が不足しています</span>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={testApiConnection}
                    className="w-full"
                    disabled={!config.access_token}
                  >
                    <Twitter className="h-4 w-4 mr-2" />
                    接続テスト
                  </Button>
                  
                  {config.created_at && (
                    <p className="text-sm text-gray-500">
                      作成日: {new Date(config.created_at).toLocaleString('ja-JP')}
                    </p>
                  )}
                  
                  {config.updated_at && (
                    <p className="text-sm text-gray-500">
                      更新日: {new Date(config.updated_at).toLocaleString('ja-JP')}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">トラブルシューティング</h3>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• X API設定が見つからない場合は、「X連携設定」ページで再設定してください</li>
                  <li>• Access Tokenが期限切れの場合は、再認証が必要です</li>
                  <li>• すべてのトークンが正しく設定されていることを確認してください</li>
                  <li>• データベーステーブル名: x_api_configs</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>X API設定が登録されていません</p>
              <p className="text-sm mt-2">「X連携設定」ページから設定してください</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}