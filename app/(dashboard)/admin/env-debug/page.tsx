'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, RefreshCw, Key } from 'lucide-react'

interface EnvCheck {
  check: Record<string, boolean>
  masked: Record<string, string>
  nodeEnv: string
  vercelEnv: string
}

export default function EnvDebugPage() {
  const [envData, setEnvData] = useState<EnvCheck | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkEnv()
  }, [])

  const checkEnv = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/debug/env-check')
      const data = await response.json()
      
      if (response.ok) {
        setEnvData(data)
      } else {
        setError('環境変数の確認に失敗しました')
      }
    } catch (error) {
      console.error('Failed to check env:', error)
      setError('環境変数の確認に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Key className="h-8 w-8" />
        環境変数デバッグ
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>環境変数の状態</span>
            <Button
              onClick={checkEnv}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              更新
            </Button>
          </CardTitle>
          <CardDescription>
            アプリケーションで使用される環境変数の設定状態を確認します
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          ) : envData ? (
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">環境情報</h3>
                <p className="text-sm">NODE_ENV: {envData.nodeEnv || 'Not set'}</p>
                <p className="text-sm">VERCEL_ENV: {envData.vercelEnv || 'Not set'}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-3">必須環境変数チェック</h3>
                <div className="space-y-2">
                  {Object.entries(envData.check).map(([key, isSet]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-white border rounded">
                      <span className="font-mono text-sm">{key}</span>
                      {isSet ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle className="h-4 w-4" />
                          設定済み
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          未設定
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">環境変数の値（マスク済み）</h3>
                <div className="space-y-2">
                  {Object.entries(envData.masked).map(([key, value]) => (
                    <div key={key} className="p-3 bg-white border rounded">
                      <p className="font-mono text-sm">{key}</p>
                      <p className="text-xs text-gray-600 mt-1">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <h3 className="font-semibold text-yellow-900 mb-2">トラブルシューティング</h3>
                <ul className="text-sm space-y-1 text-yellow-800">
                  <li>• Vercelでは、環境変数を変更後、再デプロイが必要です</li>
                  <li>• ローカル開発では .env.local ファイルに環境変数を設定してください</li>
                  <li>• X_API_SECRET と X_ACCESS_SECRET は異なる値です（X_API_SECRET はAPI Key Secret）</li>
                  <li>• すべてのX_で始まる環境変数が設定されていることを確認してください</li>
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
    </div>
  )
}