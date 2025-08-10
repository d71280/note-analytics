'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

export default function SetupPage() {
  const [supabaseUrl, setSupabaseUrl] = useState('https://tgoeimslzozeicgtdeco.supabase.co')
  const [anonKey, setAnonKey] = useState('')
  const [serviceKey, setServiceKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{
    success: boolean
    error?: string
    details?: string | Error
    results?: {
      envSetup?: boolean
      tableCreation?: boolean
      apiKeyGeneration?: boolean
      errors?: string[]
    }
    nextSteps?: string[]
    apiKeyTest?: Record<string, unknown>
  } | null>(null)
  const [envStatus, setEnvStatus] = useState<{
    envFileExists?: boolean
    currentEnv?: Record<string, string>
  } | null>(null)

  const checkEnvironment = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/setup-env')
      const data = await response.json()
      setEnvStatus(data)
    } catch (error) {
      console.error('Failed to check environment:', error)
    } finally {
      setLoading(false)
    }
  }

  const completeSetup = async () => {
    if (!supabaseUrl || !anonKey || !serviceKey) {
      alert('すべてのフィールドを入力してください')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/complete-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supabaseUrl,
          anonKey,
          serviceKey
        })
      })
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Failed to complete setup:', error)
      setResults({
        success: false,
        error: 'セットアップに失敗しました',
        details: error instanceof Error ? error.message : String(error)
      })
    } finally {
      setLoading(false)
    }
  }

  const testApiKey = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/gpts/api-key', {
        method: 'POST'
      })
      const data = await response.json()
      setResults({
        success: response.ok,
        apiKeyTest: data
      })
    } catch (error) {
      console.error('Failed to test API key:', error)
      setResults({
        success: false,
        error: 'APIキーテストに失敗しました'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">GPTs連携セットアップ</h1>
          <p className="text-muted-foreground">
            Supabaseテーブル作成からGPTs連携までの完全セットアップ
          </p>
        </div>
        <Button onClick={checkEnvironment} disabled={loading}>
          環境確認
        </Button>
      </div>

      {/* 環境状況 */}
      {envStatus && (
        <Card>
          <CardHeader>
            <CardTitle>環境設定状況</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>環境変数ファイル:</span>
                <Badge variant={envStatus.envFileExists ? "default" : "destructive"}>
                  {envStatus.envFileExists ? "存在" : "未作成"}
                </Badge>
              </div>
              {envStatus.currentEnv && Object.entries(envStatus.currentEnv).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span>{key}:</span>
                  <Badge variant={value === '設定済み' ? "default" : "destructive"}>
                    {value}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supabase設定 */}
      <Card>
        <CardHeader>
          <CardTitle>Supabase設定</CardTitle>
          <CardDescription>
            Supabaseダッシュボードから取得した設定を入力してください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supabaseUrl">Project URL</Label>
            <Input
              id="supabaseUrl"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="anonKey">Anon Public Key</Label>
            <Input
              id="anonKey"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="serviceKey">Service Role Key</Label>
            <Input
              id="serviceKey"
              value={serviceKey}
              onChange={(e) => setServiceKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            />
          </div>
          <Button onClick={completeSetup} disabled={loading} className="w-full">
            {loading ? 'セットアップ中...' : '完全セットアップ実行'}
          </Button>
        </CardContent>
      </Card>

      {/* 結果表示 */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>セットアップ結果</CardTitle>
          </CardHeader>
          <CardContent>
            {results.success ? (
              <Alert>
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="default">成功</Badge>
                      <span>セットアップが完了しました</span>
                    </div>
                    {results.results && (
                      <div className="space-y-1">
                        <div>環境変数設定: {results.results.envSetup ? '✅' : '❌'}</div>
                        <div>テーブル作成: {results.results.tableCreation ? '✅' : '❌'}</div>
                        <div>APIキー生成: {results.results.apiKeyGeneration ? '✅' : '❌'}</div>
                      </div>
                    )}
                    {results.nextSteps && (
                      <div className="mt-4">
                        <h4 className="font-semibold">次のステップ:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {results.nextSteps.map((step: string, index: number) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="destructive">失敗</Badge>
                      <span>セットアップに失敗しました</span>
                    </div>
                    {results.error && <div>エラー: {results.error}</div>}
                    {results.details && (
                      <div>詳細: {
                        typeof results.details === 'string' 
                          ? results.details 
                          : results.details instanceof Error 
                            ? results.details.message 
                            : 'Unknown error'
                      }</div>
                    )}
                    {results.results?.errors && (
                      <div>
                        <h4 className="font-semibold">エラー詳細:</h4>
                        <ul className="list-disc list-inside">
                          {results.results.errors.map((error: string, index: number) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* APIキーテスト */}
      <Card>
        <CardHeader>
          <CardTitle>APIキーテスト</CardTitle>
          <CardDescription>
            セットアップ完了後、APIキーが正常に生成されるかテストします
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={testApiKey} disabled={loading}>
            APIキー生成テスト
          </Button>
        </CardContent>
      </Card>

      {/* 手動設定手順 */}
      <Card>
        <CardHeader>
          <CardTitle>手動設定手順</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">1. Supabase設定の取得</h4>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Supabaseダッシュボードにアクセス</li>
                <li>プロジェクトを選択</li>
                <li>Settings → API で以下を確認:
                  <ul className="list-disc list-inside ml-4">
                    <li>Project URL</li>
                    <li>anon public key</li>
                    <li>service_role key</li>
                  </ul>
                </li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold">2. GPTs Actions設定</h4>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>GPTsの設定画面で「Configure」→「Add actions」</li>
                <li>Schema欄にGPTS_ACTION_SCHEMA.jsonの内容を貼り付け</li>
                <li>認証設定:
                  <ul className="list-disc list-inside ml-4">
                    <li>Authentication: API Key</li>
                    <li>Header name: x-api-key</li>
                    <li>Value: 生成されたAPIキー</li>
                  </ul>
                </li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 