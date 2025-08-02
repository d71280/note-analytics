'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, XCircle, Twitter, Loader2, Save, Trash2 } from 'lucide-react'

interface XApiConfig {
  api_key: string
  api_secret: string
  access_token: string
  access_token_secret: string
  username?: string
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [config, setConfig] = useState<XApiConfig>({
    api_key: '',
    api_secret: '',
    access_token: '',
    access_token_secret: '',
  })
  const [hasConfig, setHasConfig] = useState(false)
  const searchParams = useSearchParams()
  
  const success = searchParams.get('success')
  const error = searchParams.get('error')

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/x/config')
      if (response.ok) {
        const data = await response.json()
        if (data.config) {
          setConfig(data.config)
          setHasConfig(true)
        }
      }
    } catch (error) {
      console.error('Failed to fetch config:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/x/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      
      if (response.ok) {
        setHasConfig(true)
        window.location.href = '/settings?success=config_saved'
      } else {
        window.location.href = '/settings?error=save_failed'
      }
    } catch (error) {
      console.error('Save error:', error)
      window.location.href = '/settings?error=save_failed'
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('本当にX API設定を削除しますか？')) return
    
    try {
      const response = await fetch('/api/x/config', {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setConfig({
          api_key: '',
          api_secret: '',
          access_token: '',
          access_token_secret: '',
        })
        setHasConfig(false)
        window.location.reload()
      }
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">X API設定</h1>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <p className="text-green-800">
            {success === 'config_saved' && 'X API設定が保存されました'}
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-600" />
          <p className="text-red-800">
            {error === 'save_failed' && '設定の保存に失敗しました'}
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Twitter className="h-5 w-5" />
            X（Twitter）API設定
          </CardTitle>
          <CardDescription>
            X API v2の認証情報を設定して、自動投稿機能を有効にします
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="api_key">API Key</Label>
                  <Input
                    id="api_key"
                    type="password"
                    value={config.api_key}
                    onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                    placeholder="API Keyを入力"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="api_secret">API Secret</Label>
                  <Input
                    id="api_secret"
                    type="password"
                    value={config.api_secret}
                    onChange={(e) => setConfig({ ...config, api_secret: e.target.value })}
                    placeholder="API Secretを入力"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="access_token">Access Token</Label>
                  <Input
                    id="access_token"
                    type="password"
                    value={config.access_token}
                    onChange={(e) => setConfig({ ...config, access_token: e.target.value })}
                    placeholder="Access Tokenを入力"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="access_token_secret">Access Token Secret</Label>
                  <Input
                    id="access_token_secret"
                    type="password"
                    value={config.access_token_secret}
                    onChange={(e) => setConfig({ ...config, access_token_secret: e.target.value })}
                    placeholder="Access Token Secretを入力"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !config.api_key || !config.api_secret || !config.access_token || !config.access_token_secret}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      設定を保存
                    </>
                  )}
                </Button>
                
                {hasConfig && (
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    設定を削除
                  </Button>
                )}
              </div>

              {hasConfig && (
                <div className="pt-6 border-t">
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
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}