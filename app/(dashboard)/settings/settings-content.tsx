'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { CheckCircle2, XCircle, Twitter, Loader2, Save, Trash2, RefreshCw, Sparkles, Eye, TestTube } from 'lucide-react'

interface XApiConfig {
  api_key: string
  api_secret: string
  access_token: string
  access_token_secret: string
  username?: string
}

interface RetweetSettings {
  enabled: boolean
  search_keywords: string[]
  min_likes: number
  min_retweets: number
  retweet_note_mentions: boolean
}

interface GrokConfig {
  api_key: string
  enabled: boolean
}

export default function SettingsContent() {
  const searchParams = useSearchParams()
  const [xApiConfig, setXApiConfig] = useState<XApiConfig>({
    api_key: '',
    api_secret: '',
    access_token: '',
    access_token_secret: ''
  })
  const [grokConfig, setGrokConfig] = useState<GrokConfig>({
    api_key: '',
    enabled: false
  })
  const [newKeyword, setNewKeyword] = useState('')
  const [retweetSettings, setRetweetSettings] = useState<RetweetSettings>({
    enabled: false,
    search_keywords: [],
    min_likes: 5,
    min_retweets: 1,
    retweet_note_mentions: true
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [showKeys, setShowKeys] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  useEffect(() => {
    fetchXApiConfig()
    fetchRetweetSettings()
    fetchGrokConfig()
    checkEnvConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'x') {
      document.getElementById('x-settings')?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [searchParams])

  const fetchXApiConfig = async () => {
    try {
      const response = await fetch('/api/x/config', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        if (data.config) {
          setXApiConfig(data.config)
          setIsConnected(true)
        }
      } else if (response.status === 401) {
        // 認証エラーの場合は設定なしとして扱う
        setIsConnected(false)
      }
    } catch (error) {
      console.error('Failed to fetch X API config:', error)
    }
  }

  const fetchRetweetSettings = async () => {
    try {
      const response = await fetch('/api/x/retweet-settings', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          setRetweetSettings(data.settings)
        }
      }
    } catch (error) {
      console.error('Failed to fetch retweet settings:', error)
    }
  }

  const fetchGrokConfig = async () => {
    try {
      const response = await fetch('/api/x/grok-config', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        if (data.config) {
          setGrokConfig(data.config)
        }
      }
    } catch (error) {
      console.error('Failed to fetch Grok config:', error)
    }
  }

  const checkEnvConfig = async () => {
    try {
      const response = await fetch('/api/config/env', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        // X APIが環境変数に設定されていて、DBに保存されていない場合
        if (data.x.configured && !isConnected) {
          // 環境変数から取得した値を表示（マスクされた状態）
          setXApiConfig({
            api_key: data.x.api_key,
            api_secret: data.x.api_secret,
            access_token: data.x.access_token,
            access_token_secret: data.x.access_token_secret
          })
        }
        // Grok APIが環境変数に設定されている場合
        if (data.grok.configured && !grokConfig.api_key) {
          setGrokConfig({
            api_key: data.grok.api_key,
            enabled: true
          })
        }
      }
    } catch (error) {
      console.error('Failed to check env config:', error)
    }
  }

  const saveXApiConfig = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/x/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(xApiConfig),
        credentials: 'include'
      })

      if (response.ok) {
        setIsConnected(true)
        await fetchXApiConfig()
        alert('X API設定を保存しました')
      } else {
        const data = await response.json()
        alert(`保存に失敗しました: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to save X API config:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const autoSetupFromEnv = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/x/config/auto-setup', {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        setIsConnected(true)
        await fetchXApiConfig()
        await fetchGrokConfig()
        alert('環境変数から設定を読み込み、保存しました')
      } else {
        const data = await response.json()
        console.error('Auto setup failed:', data)
        alert(`環境変数からの設定に失敗しました: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to auto setup:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const saveRetweetSettings = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/x/retweet-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(retweetSettings),
        credentials: 'include'
      })

      if (response.ok) {
        await fetchRetweetSettings()
      }
    } catch (error) {
      console.error('Failed to save retweet settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const saveGrokConfig = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/x/grok-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(grokConfig),
        credentials: 'include'
      })

      if (response.ok) {
        await fetchGrokConfig()
      }
    } catch (error) {
      console.error('Failed to save Grok config:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const disconnectX = async () => {
    if (!confirm('X連携を解除しますか？')) return

    try {
      const response = await fetch('/api/x/config', {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        setXApiConfig({
          api_key: '',
          api_secret: '',
          access_token: '',
          access_token_secret: ''
        })
        setIsConnected(false)
      }
    } catch (error) {
      console.error('Failed to disconnect X:', error)
    }
  }

  const addKeyword = () => {
    if (newKeyword && !retweetSettings.search_keywords.includes(newKeyword)) {
      setRetweetSettings({
        ...retweetSettings,
        search_keywords: [...retweetSettings.search_keywords, newKeyword]
      })
      setNewKeyword('')
    }
  }

  const removeKeyword = (keyword: string) => {
    setRetweetSettings({
      ...retweetSettings,
      search_keywords: retweetSettings.search_keywords.filter(k => k !== keyword)
    })
  }

  const runAutoRetweet = async () => {
    try {
      const response = await fetch('/api/x/auto-retweet-scheduler', {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        const result = await response.json()
        alert(`自動リツイート完了: ${result.retweetedCount}件のツイートをリツイートしました`)
      }
    } catch (error) {
      console.error('Failed to run auto retweet:', error)
    }
  }

  const testXConnection = async () => {
    setIsTesting(true)
    try {
      const response = await fetch('/api/x/test-connection', {
        method: 'POST',
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        alert(`X API接続テスト成功！\nユーザー: @${data.user.username || data.user.name}`)
      } else {
        alert(`X API接続テスト失敗: ${data.error}`)
      }
    } catch {
      alert('接続テストに失敗しました')
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6">
      <Card id="x-settings">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Twitter className="h-5 w-5" />
            X（Twitter）連携設定
          </CardTitle>
          <CardDescription>
            X API v2の認証情報を設定して、自動投稿・リツイート機能を有効化します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span>連携済み {xApiConfig.username && `(@${xApiConfig.username})`}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-500">
              <XCircle className="h-5 w-5" />
              <span>未連携</span>
            </div>
          )}

          <div className="p-4 bg-blue-50 rounded-lg space-y-3">
            <p className="text-sm text-blue-800">
              <strong>環境変数から設定を読み込む</strong><br />
              Vercelに設定された環境変数から自動的にX API設定を読み込みます。
            </p>
            <Button
              onClick={autoSetupFromEnv}
              disabled={isSaving}
              variant="outline"
              size="sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  設定中...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  環境変数から自動設定
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="flex gap-2">
              <Input
                type={showKeys ? "text" : "password"}
                value={xApiConfig.api_key}
                onChange={(e) => setXApiConfig({ ...xApiConfig, api_key: e.target.value })}
                placeholder="Enter your X API Key"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowKeys(!showKeys)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>API Key Secret</Label>
            <Input
              type={showKeys ? "text" : "password"}
              value={xApiConfig.api_secret}
              onChange={(e) => setXApiConfig({ ...xApiConfig, api_secret: e.target.value })}
              placeholder="Enter your X API Key Secret"
            />
          </div>

          <div className="space-y-2">
            <Label>Access Token</Label>
            <Input
              type={showKeys ? "text" : "password"}
              value={xApiConfig.access_token}
              onChange={(e) => setXApiConfig({ ...xApiConfig, access_token: e.target.value })}
              placeholder="Enter your Access Token"
            />
          </div>

          <div className="space-y-2">
            <Label>Access Token Secret</Label>
            <Input
              type={showKeys ? "text" : "password"}
              value={xApiConfig.access_token_secret}
              onChange={(e) => setXApiConfig({ ...xApiConfig, access_token_secret: e.target.value })}
              placeholder="Enter your Access Token Secret"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={saveXApiConfig} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  保存
                </>
              )}
            </Button>
            {isConnected && (
              <>
                <Button variant="outline" onClick={testXConnection} disabled={isTesting}>
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
                <Button variant="destructive" onClick={disconnectX}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  連携解除
                </Button>
              </>
            )}
          </div>

          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>注意:</strong> X API Basic tierの制限により、1日の投稿数は17件までです。
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Grok AI設定
          </CardTitle>
          <CardDescription>
            Grok APIを使用してより高品質なツイートを生成します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="grok-enabled">Grok AIを有効化</Label>
            <Switch
              id="grok-enabled"
              checked={grokConfig.enabled}
              onCheckedChange={(checked) => setGrokConfig({ ...grokConfig, enabled: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label>Grok API Key</Label>
            <Input
              type={showKeys ? "text" : "password"}
              value={grokConfig.api_key}
              onChange={(e) => setGrokConfig({ ...grokConfig, api_key: e.target.value })}
              placeholder="Enter your Grok API Key"
              disabled={!grokConfig.enabled}
            />
          </div>

          <Button onClick={saveGrokConfig} disabled={isSaving || !grokConfig.enabled}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                保存
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            自動リツイート設定
          </CardTitle>
          <CardDescription>
            指定したキーワードのツイートを自動的にリツイートします
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="retweet-enabled">自動リツイートを有効化</Label>
            <Switch
              id="retweet-enabled"
              checked={retweetSettings.enabled}
              onCheckedChange={(checked) => setRetweetSettings({ ...retweetSettings, enabled: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label>検索キーワード</Label>
            <div className="flex gap-2">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="キーワードを入力"
                onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
              />
              <Button onClick={addKeyword}>追加</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {retweetSettings.search_keywords.map((keyword) => (
                <div key={keyword} className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                  <span className="text-sm">{keyword}</span>
                  <button
                    onClick={() => removeKeyword(keyword)}
                    className="text-gray-500 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>最小いいね数</Label>
              <Input
                type="number"
                value={retweetSettings.min_likes}
                onChange={(e) => setRetweetSettings({ ...retweetSettings, min_likes: parseInt(e.target.value) || 0 })}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>最小リツイート数</Label>
              <Input
                type="number"
                value={retweetSettings.min_retweets}
                onChange={(e) => setRetweetSettings({ ...retweetSettings, min_retweets: parseInt(e.target.value) || 0 })}
                min={0}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="retweet-note">noteに関する言及も含める</Label>
            <Switch
              id="retweet-note"
              checked={retweetSettings.retweet_note_mentions}
              onCheckedChange={(checked) => setRetweetSettings({ ...retweetSettings, retweet_note_mentions: checked })}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={saveRetweetSettings} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  保存
                </>
              )}
            </Button>
            <Button variant="outline" onClick={runAutoRetweet}>
              <RefreshCw className="mr-2 h-4 w-4" />
              今すぐ実行
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}