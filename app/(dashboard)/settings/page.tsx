'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, Copy } from 'lucide-react'
import XSettings from './x-settings'

export default function SettingsPage() {
  const [noteSettings, setNoteSettings] = useState({
    email: 'muchinochikaigi@gmail.com',
    password: 'sky05410',
    apiKey: ''
  })
  const [wordpressSettings, setWordpressSettings] = useState({
    url: 'https://muchino-chi.com',
    username: 'admin_muchinochi',
    password: '69Kushimoto'
  })
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<{
    wordpress?: { success: boolean; message: string }
    note?: { success: boolean; message: string }
  }>({})

  useEffect(() => {
    fetchApiKey()
  }, [])

  const fetchApiKey = async () => {
    try {
      const response = await fetch('/api/gpts/api-key')
      if (response.ok) {
        const data = await response.json()
        setApiKey(data.apiKey || '')
      }
    } catch (error) {
      console.error('Failed to fetch API key:', error)
    }
  }

  const generateNewApiKey = async () => {
    try {
      const response = await fetch('/api/gpts/api-key', {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setApiKey(data.apiKey)
        alert('新しいAPIキーを生成しました')
      }
    } catch (error) {
      console.error('Failed to generate API key:', error)
      alert('APIキーの生成に失敗しました')
    }
  }

  const copyToClipboard = (text: string, label?: string) => {
    navigator.clipboard.writeText(text)
    setCopySuccess(label || 'copied')
    setTimeout(() => setCopySuccess(null), 2000)
  }

  const testWordPressConnection = async () => {
    setTestingConnection(true)
    try {
      const response = await fetch('/api/wordpress/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wordpressSettings)
      })
      
      const data = await response.json()
      
      setConnectionStatus(prev => ({
        ...prev,
        wordpress: {
          success: response.ok,
          message: response.ok ? '接続成功！' : data.error || '接続に失敗しました'
        }
      }))
    } catch {
      setConnectionStatus(prev => ({
        ...prev,
        wordpress: {
          success: false,
          message: '接続テストに失敗しました'
        }
      }))
    } finally {
      setTestingConnection(false)
    }
  }

  const testNoteConnection = async () => {
    setTestingConnection(true)
    try {
      const response = await fetch('/api/note/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteSettings)
      })
      
      const data = await response.json()
      
      setConnectionStatus(prev => ({
        ...prev,
        note: {
          success: response.ok,
          message: response.ok ? '接続成功！' : data.error || '接続に失敗しました'
        }
      }))
    } catch {
      setConnectionStatus(prev => ({
        ...prev,
        note: {
          success: false,
          message: '接続テストに失敗しました'
        }
      }))
    } finally {
      setTestingConnection(false)
    }
  }

  const saveSettings = async () => {
    // TODO: 設定を保存するAPIを実装
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold">設定</h1>
      
      {/* GPTs連携設定 */}
      <Card>
        <CardHeader>
          <CardTitle>GPTs連携設定</CardTitle>
          <CardDescription>
            GPTsのActionsに設定するAPIエンドポイントとキー
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-base font-semibold mb-2 block">APIエンドポイント</Label>
            
            {/* プラットフォーム別エンドポイント */}
            <div className="space-y-2 mb-3">
              {/* X専用 */}
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">X</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold">X (Twitter)専用</div>
                    <Input 
                      readOnly 
                      value={typeof window !== 'undefined' ? `${window.location.origin}/api/gpts/receive-x` : 'https://note-analytics.vercel.app/api/gpts/receive-x'}
                      className="mt-1 font-mono text-xs bg-white"
                    />
                  </div>
                </div>
                <Button 
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => copyToClipboard(typeof window !== 'undefined' ? `${window.location.origin}/api/gpts/receive-x` : 'https://note-analytics.vercel.app/api/gpts/receive-x', 'x-endpoint')}
                >
                  {copySuccess === 'x-endpoint' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Note専用 */}
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">N</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold">Note専用</div>
                    <Input 
                      readOnly 
                      value={typeof window !== 'undefined' ? `${window.location.origin}/api/gpts/receive-note` : 'https://note-analytics.vercel.app/api/gpts/receive-note'}
                      className="mt-1 font-mono text-xs bg-white"
                    />
                  </div>
                </div>
                <Button 
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => copyToClipboard(typeof window !== 'undefined' ? `${window.location.origin}/api/gpts/receive-note` : 'https://note-analytics.vercel.app/api/gpts/receive-note', 'note-endpoint')}
                >
                  {copySuccess === 'note-endpoint' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* WordPress専用 */}
              <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-8 h-8 bg-purple-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">W</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold">WordPress専用</div>
                    <Input 
                      readOnly 
                      value={typeof window !== 'undefined' ? `${window.location.origin}/api/gpts/receive-wordpress` : 'https://note-analytics.vercel.app/api/gpts/receive-wordpress'}
                      className="mt-1 font-mono text-xs bg-white"
                    />
                  </div>
                </div>
                <Button 
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => copyToClipboard(typeof window !== 'undefined' ? `${window.location.origin}/api/gpts/receive-wordpress` : 'https://note-analytics.vercel.app/api/gpts/receive-wordpress', 'wp-endpoint')}
                >
                  {copySuccess === 'wp-endpoint' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            {/* 自動振り分け */}
            <details className="text-xs text-gray-500">
              <summary className="cursor-pointer hover:text-gray-700">自動振り分けエンドポイント（文字数で判定）</summary>
              <div className="mt-2 p-2 bg-gray-50 rounded">
                <Input 
                  readOnly 
                  value={typeof window !== 'undefined' ? `${window.location.origin}/api/gpts/receive-content` : 'https://note-analytics.vercel.app/api/gpts/receive-content'}
                  className="font-mono text-xs bg-white"
                />
              </div>
            </details>
          </div>

          <div>
            <Label className="text-base font-semibold mb-2 block">APIキー</Label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input 
                  readOnly 
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey || '••••••••••••••••'}
                  placeholder="APIキーが設定されていません"
                  className="pr-20 font-mono bg-gray-50"
                />
                <Button 
                  size="sm"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-xs"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? '隠す' : '表示'}
                </Button>
              </div>
              <Button 
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(apiKey, 'apikey')}
                disabled={!apiKey}
              >
                {copySuccess === 'apikey' ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                    コピー済
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    コピー
                  </>
                )}
              </Button>
              <Button 
                size="sm"
                onClick={generateNewApiKey}
              >
                新規生成
              </Button>
            </div>
            {apiKey && (
              <p className="text-xs text-gray-500 mt-1">
                ✅ APIキーが設定されています
              </p>
            )}
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">🔧 GPTsの設定方法：</h3>
            <ol className="space-y-2 text-sm">
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">1</span>
                <p>GPTsの「Configure」→ 「Add actions」を選択</p>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">2</span>
                <p>上記のAPIエンドポイントをServer URLに設定</p>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">3</span>
                <p>Authentication TypeをAPI Keyに設定</p>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">4</span>
                <p>Header nameを「x-api-key」に設定</p>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">5</span>
                <p>API Keyに上記のキーを入力</p>
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* X (Twitter) API設定 */}
      <XSettings />
      
      {/* note API設定 */}
      <Card>
        <CardHeader>
          <CardTitle>note API設定</CardTitle>
          <CardDescription>
            noteへの自動投稿に必要な認証情報を設定します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold">注意事項</p>
                <p>noteは公式APIを提供していないため、非公式な方法での連携となります。</p>
                <p>仕様変更により動作しなくなる可能性があります。</p>
              </div>
            </div>
          </div>
          
          <div>
            <Label>メールアドレス</Label>
            <Input
              type="email"
              value={noteSettings.email}
              onChange={(e) => setNoteSettings({...noteSettings, email: e.target.value})}
              placeholder="note@example.com"
            />
          </div>
          
          <div>
            <Label>パスワード</Label>
            <Input
              type="password"
              value={noteSettings.password}
              onChange={(e) => setNoteSettings({...noteSettings, password: e.target.value})}
              placeholder="••••••••"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={testNoteConnection}
              disabled={testingConnection}
              variant="outline"
            >
              {testingConnection ? '接続テスト中...' : '接続テスト'}
            </Button>
            
            {connectionStatus.note && (
              <div className={`text-sm ${connectionStatus.note.success ? 'text-green-600' : 'text-red-600'}`}>
                {connectionStatus.note.success ? (
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    {connectionStatus.note.message}
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {connectionStatus.note.message}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* WordPress API設定 */}
      <Card>
        <CardHeader>
          <CardTitle>WordPress API設定</CardTitle>
          <CardDescription>
            WordPressサイトへの自動投稿に必要な情報を設定します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>サイトURL</Label>
            <Input
              type="url"
              value={wordpressSettings.url}
              onChange={(e) => setWordpressSettings({...wordpressSettings, url: e.target.value})}
              placeholder="https://your-site.com"
            />
            <p className="text-xs text-gray-500 mt-1">WordPress REST APIが有効なサイトのURLを入力</p>
          </div>
          
          <div>
            <Label>ユーザー名</Label>
            <Input
              value={wordpressSettings.username}
              onChange={(e) => setWordpressSettings({...wordpressSettings, username: e.target.value})}
              placeholder="admin"
            />
          </div>
          
          <div>
            <Label>アプリケーションパスワード</Label>
            <Input
              type="password"
              value={wordpressSettings.password}
              onChange={(e) => setWordpressSettings({...wordpressSettings, password: e.target.value})}
              placeholder="••••••••"
            />
            <p className="text-xs text-gray-500 mt-1">
              WordPressの「ユーザー」→「プロフィール」→「アプリケーションパスワード」から生成
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={testWordPressConnection}
              disabled={testingConnection}
              variant="outline"
            >
              {testingConnection ? '接続テスト中...' : '接続テスト'}
            </Button>
            
            {connectionStatus.wordpress && (
              <div className={`text-sm ${connectionStatus.wordpress.success ? 'text-green-600' : 'text-red-600'}`}>
                {connectionStatus.wordpress.success ? (
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    {connectionStatus.wordpress.message}
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {connectionStatus.wordpress.message}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* 保存ボタン */}
      <div className="flex justify-end">
        <Button onClick={saveSettings}>
          {saved ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              保存済み
            </>
          ) : (
            '設定を保存'
          )}
        </Button>
      </div>
    </div>
  )
}