'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle } from 'lucide-react'
import XSettings from './x-settings'

export default function SettingsPage() {
  const [noteSettings, setNoteSettings] = useState({
    email: '',
    password: '',
    apiKey: ''
  })
  const [wordpressSettings, setWordpressSettings] = useState({
    url: '',
    username: '',
    password: ''
  })
  const [saved, setSaved] = useState(false)

  const saveSettings = async () => {
    // TODO: 設定を保存するAPIを実装
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold">設定</h1>
      
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