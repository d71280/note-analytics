import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { User, Bell, Shield, Palette } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold text-gray-900">設定</h1>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>プロフィール設定</CardTitle>
            </div>
            <CardDescription>
              あなたの基本情報を設定します
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">表示名</Label>
              <Input id="name" placeholder="あなたの名前" />
            </div>
            <div>
              <Label htmlFor="note-username">Note ユーザー名</Label>
              <Input id="note-username" placeholder="@username" />
            </div>
            <div>
              <Label htmlFor="bio">自己紹介</Label>
              <Textarea
                id="bio"
                placeholder="簡単な自己紹介を入力..."
                rows={3}
              />
            </div>
            <Button>プロフィールを更新</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>通知設定</CardTitle>
            </div>
            <CardDescription>
              通知の受け取り方法を設定します
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>トレンド通知</Label>
                <p className="text-sm text-gray-600">新しいトレンド記事の通知を受け取る</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>分析完了通知</Label>
                <p className="text-sm text-gray-600">記事分析が完了したときに通知</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>週次レポート</Label>
                <p className="text-sm text-gray-600">毎週のトレンドレポートを受け取る</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              <CardTitle>表示設定</CardTitle>
            </div>
            <CardDescription>
              アプリケーションの表示をカスタマイズ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>ダークモード</Label>
                <p className="text-sm text-gray-600">暗い背景色を使用</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>コンパクト表示</Label>
                <p className="text-sm text-gray-600">情報を密に表示</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>プライバシー設定</CardTitle>
            </div>
            <CardDescription>
              データの取り扱いについて設定します
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>分析履歴の保存</Label>
                <p className="text-sm text-gray-600">記事分析の履歴を保存する</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>匿名統計の提供</Label>
                <p className="text-sm text-gray-600">サービス改善のための匿名データ提供</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
    />
  )
}