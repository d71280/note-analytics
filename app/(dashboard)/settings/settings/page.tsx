'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, XCircle, Twitter, Loader2, Trash2 } from 'lucide-react'

interface XAccount {
  user_id: string
  username: string
  name: string
  connected_at: string
}

export default function SettingsPage() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectedAccount, setConnectedAccount] = useState<XAccount | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const searchParams = useSearchParams()
  
  const success = searchParams.get('success')
  const error = searchParams.get('error')

  useEffect(() => {
    fetchConnectedAccount()
  }, [])

  const fetchConnectedAccount = async () => {
    try {
      const response = await fetch('/api/auth/x/account')
      if (response.ok) {
        const data = await response.json()
        setConnectedAccount(data.account)
      }
    } catch (error) {
      console.error('Failed to fetch account:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      const response = await fetch('/api/auth/x')
      const data = await response.json()
      
      if (data.authUrl) {
        window.location.href = data.authUrl
      }
    } catch (error) {
      console.error('Connection error:', error)
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('本当にX連携を解除しますか？')) return
    
    try {
      const response = await fetch('/api/auth/x/disconnect', {
        method: 'POST'
      })
      
      if (response.ok) {
        setConnectedAccount(null)
        window.location.reload()
      }
    } catch (error) {
      console.error('Disconnect error:', error)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">X連携設定</h1>

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success === 'x_connected' && 'Xアカウントの連携が完了しました'}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error === 'auth_failed' && '認証に失敗しました。もう一度お試しください。'}
            {error === 'invalid_request' && '無効なリクエストです。'}
            {error === 'database_error' && 'データベースエラーが発生しました。'}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Twitter className="h-5 w-5" />
            X（Twitter）アカウント連携
          </CardTitle>
          <CardDescription>
            noteの分析結果を自動的にXに投稿するための設定です
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : connectedAccount ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">@{connectedAccount.username}</p>
                  <p className="text-sm text-gray-600">{connectedAccount.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    連携日時: {new Date(connectedAccount.connected_at).toLocaleString('ja-JP')}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDisconnect}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  連携解除
                </Button>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">自動投稿設定</h3>
                <p className="text-sm text-gray-600 mb-4">
                  トレンド分析の結果を定期的にXに投稿します
                </p>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">毎日のトレンドサマリーを投稿</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">注目記事の分析結果を投稿</span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                Xアカウントと連携して、分析結果を自動投稿しましょう
              </p>
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    接続中...
                  </>
                ) : (
                  <>
                    <Twitter className="mr-2 h-4 w-4" />
                    Xアカウントを連携
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}