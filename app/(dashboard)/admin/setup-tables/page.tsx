'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Database, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function SetupTablesPage() {
  const [isCreating, setIsCreating] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null)

  const createTables = async () => {
    setIsCreating(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/admin/create-x-tables', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setResult({ success: true })
      } else {
        setResult({ error: data.error || '予期しないエラーが発生しました' })
      }
    } catch {
      setResult({ error: 'テーブル作成に失敗しました' })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Database className="h-8 w-8" />
        データベーステーブルセットアップ
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>X API関連テーブルの作成</CardTitle>
          <CardDescription>
            X API連携に必要なデータベーステーブルを作成します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              以下のテーブルが作成されます：
            </p>
            <ul className="text-sm space-y-1 list-disc list-inside text-gray-600">
              <li>x_api_configs - X API認証情報</li>
              <li>RLSポリシー - ユーザー毎のアクセス制御</li>
            </ul>

            <Button 
              onClick={createTables} 
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  作成中...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  テーブルを作成
                </>
              )}
            </Button>

            {result && (
              <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
                {result.success ? (
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    <span>テーブルが正常に作成されました</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    <span>{result.error}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-semibold text-yellow-900 mb-2">注意事項</h3>
        <ul className="text-sm space-y-1 text-yellow-800">
          <li>• Supabaseで直接SQLを実行する権限が必要です</li>
          <li>• エラーが発生した場合は、Supabase ダッシュボードから直接SQLを実行してください</li>
          <li>• /supabase/migrations/20250806_create_x_api_tables.sql ファイルにSQLが保存されています</li>
        </ul>
      </div>
    </div>
  )
}