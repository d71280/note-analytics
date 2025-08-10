'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Key, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Save,
  TestTube,
  Loader2
} from 'lucide-react'

interface ApiConfig {
  platform: 'x' | 'openai' | 'gpts'
  configured: boolean
  lastUpdated?: string
  status?: 'active' | 'invalid' | 'expired'
}

export default function ApiKeysPage() {
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [configs, setConfigs] = useState<ApiConfig[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // X API設定
  const [xApiKey, setXApiKey] = useState('')
  const [xApiSecret, setXApiSecret] = useState('')
  const [xAccessToken, setXAccessToken] = useState('')
  const [xAccessTokenSecret, setXAccessTokenSecret] = useState('')
  
  // OpenAI API設定
  const [openaiKey, setOpenaiKey] = useState('')
  
  // GPTs API設定
  const [gptsApiKey, setGptsApiKey] = useState('')

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/settings/api-configs')
      if (response.ok) {
        const data = await response.json()
        setConfigs(data.configs || [])
        
        // マスクされた値を表示（最初と最後の文字のみ）
        if (data.masked) {
          setXApiKey(data.masked.x_api_key || '')
          setXApiSecret(data.masked.x_api_secret || '')
          setXAccessToken(data.masked.x_access_token || '')
          setXAccessTokenSecret(data.masked.x_access_token_secret || '')
          setOpenaiKey(data.masked.openai_key || '')
          setGptsApiKey(data.masked.gpts_api_key || '')
        }
      }
    } catch (error) {
      console.error('Failed to fetch configs:', error)
    }
  }

  const saveXConfig = async () => {
    setLoading(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/settings/x-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: xApiKey,
          api_secret: xApiSecret,
          access_token: xAccessToken,
          access_token_secret: xAccessTokenSecret
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'X API設定を保存しました' })
        fetchConfigs()
      } else {
        setMessage({ type: 'error', text: data.error || '保存に失敗しました' })
      }
    } catch {
      setMessage({ type: 'error', text: '保存中にエラーが発生しました' })
    } finally {
      setLoading(false)
    }
  }

  const saveOpenAIConfig = async () => {
    setLoading(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/settings/openai-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: openaiKey })
      })

      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'OpenAI API設定を保存しました' })
        fetchConfigs()
      } else {
        setMessage({ type: 'error', text: data.error || '保存に失敗しました' })
      }
    } catch {
      setMessage({ type: 'error', text: '保存中にエラーが発生しました' })
    } finally {
      setLoading(false)
    }
  }

  const generateGPTsKey = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/gpts/generate-key')
      const data = await response.json()
      
      if (response.ok) {
        setGptsApiKey(data.apiKey)
        setMessage({ type: 'success', text: '新しいAPIキーを生成しました' })
      }
    } catch {
      setMessage({ type: 'error', text: 'APIキー生成に失敗しました' })
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async (platform: string) => {
    setTesting(platform)
    
    try {
      const response = await fetch(`/api/settings/test-${platform}`)
      const data = await response.json()
      
      if (response.ok && data.success) {
        setMessage({ type: 'success', text: `${platform.toUpperCase()} API接続成功` })
      } else {
        setMessage({ type: 'error', text: data.error || '接続テストに失敗しました' })
      }
    } catch {
      setMessage({ type: 'error', text: '接続テスト中にエラーが発生しました' })
    } finally {
      setTesting(null)
    }
  }

  const toggleShowKey = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Key className="h-8 w-8" />
          API認証情報管理
        </h1>
        <p className="text-gray-600 mt-2">
          各種APIの認証情報を安全に管理します
        </p>
      </div>

      {message && (
        <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
          <AlertDescription className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* API設定状況サマリー */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            API設定状況
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {configs.map(config => (
              <div key={config.platform} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">{config.platform.toUpperCase()}</span>
                <Badge variant={config.configured ? "default" : "destructive"}>
                  {config.configured ? '設定済み' : '未設定'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="x" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="x">X (Twitter)</TabsTrigger>
          <TabsTrigger value="openai">OpenAI</TabsTrigger>
          <TabsTrigger value="gpts">GPTs連携</TabsTrigger>
        </TabsList>

        {/* X API設定 */}
        <TabsContent value="x">
          <Card>
            <CardHeader>
              <CardTitle>X (Twitter) API設定</CardTitle>
              <CardDescription>
                X Developer Portalから取得した認証情報を入力してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="x-api-key">API Key (Consumer Key)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="x-api-key"
                      type={showKeys['x-api-key'] ? 'text' : 'password'}
                      value={xApiKey}
                      onChange={(e) => setXApiKey(e.target.value)}
                      placeholder="Enter API Key"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleShowKey('x-api-key')}
                    >
                      {showKeys['x-api-key'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="x-api-secret">API Secret (Consumer Secret)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="x-api-secret"
                      type={showKeys['x-api-secret'] ? 'text' : 'password'}
                      value={xApiSecret}
                      onChange={(e) => setXApiSecret(e.target.value)}
                      placeholder="Enter API Secret"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleShowKey('x-api-secret')}
                    >
                      {showKeys['x-api-secret'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="x-access-token">Access Token</Label>
                  <div className="flex gap-2">
                    <Input
                      id="x-access-token"
                      type={showKeys['x-access-token'] ? 'text' : 'password'}
                      value={xAccessToken}
                      onChange={(e) => setXAccessToken(e.target.value)}
                      placeholder="Enter Access Token"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleShowKey('x-access-token')}
                    >
                      {showKeys['x-access-token'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="x-access-secret">Access Token Secret</Label>
                  <div className="flex gap-2">
                    <Input
                      id="x-access-secret"
                      type={showKeys['x-access-secret'] ? 'text' : 'password'}
                      value={xAccessTokenSecret}
                      onChange={(e) => setXAccessTokenSecret(e.target.value)}
                      placeholder="Enter Access Token Secret"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleShowKey('x-access-secret')}
                    >
                      {showKeys['x-access-secret'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => testConnection('x')}
                  disabled={testing === 'x'}
                >
                  {testing === 'x' ? (
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
                <Button onClick={saveXConfig} disabled={loading}>
                  {loading ? (
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OpenAI API設定 */}
        <TabsContent value="openai">
          <Card>
            <CardHeader>
              <CardTitle>OpenAI API設定</CardTitle>
              <CardDescription>
                OpenAI Platformから取得したAPIキーを入力してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openai-key">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="openai-key"
                    type={showKeys['openai'] ? 'text' : 'password'}
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-..."
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => toggleShowKey('openai')}
                  >
                    {showKeys['openai'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => testConnection('openai')}
                  disabled={testing === 'openai'}
                >
                  {testing === 'openai' ? (
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
                <Button onClick={saveOpenAIConfig} disabled={loading}>
                  {loading ? (
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GPTs API設定 */}
        <TabsContent value="gpts">
          <Card>
            <CardHeader>
              <CardTitle>GPTs連携設定</CardTitle>
              <CardDescription>
                GPTsのActionsで使用するAPIキーを管理します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gpts-key">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="gpts-key"
                    type={showKeys['gpts'] ? 'text' : 'password'}
                    value={gptsApiKey}
                    readOnly
                    placeholder="APIキーを生成してください"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => toggleShowKey('gpts')}
                  >
                    {showKeys['gpts'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={generateGPTsKey} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      新しいキーを生成
                    </>
                  )}
                </Button>
              </div>

              <Alert>
                <AlertDescription>
                  <h4 className="font-semibold mb-2">GPTsでの設定方法:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>GPTsの「Configure」→「Add actions」を選択</li>
                    <li>Authentication TypeをAPI Keyに設定</li>
                    <li>Header nameを「x-api-key」に設定</li>
                    <li>上記のAPIキーを入力</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}