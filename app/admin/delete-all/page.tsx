'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react'

export default function DeleteAllPage() {
  const [isDeleting, setIsDeleting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleForceDeleteAll = async () => {
    if (!confirm('⚠️ 警告: すべてのスケジュール投稿を完全に削除します。\n\nこの操作は取り消せません。本当に続行しますか？')) {
      return
    }
    
    if (!confirm('最終確認: 本当にすべての投稿を削除してもよろしいですか？')) {
      return
    }

    setIsDeleting(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/x/scheduled-posts/force-delete-all?confirm=DELETE_ALL', {
        method: 'DELETE',
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || '削除に失敗しました')
      }
    } catch (err) {
      console.error('Delete error:', err)
      setError('削除中にエラーが発生しました')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-6 w-6" />
            管理者用: 強制削除
          </CardTitle>
          <CardDescription>
            RLSを無視してすべてのスケジュール投稿を削除します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">注意事項</h3>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              <li>この操作はすべてのスケジュール投稿を完全に削除します</li>
              <li>削除された投稿は復元できません</li>
              <li>RLS（Row Level Security）を無視して削除します</li>
              <li>管理者権限で実行されます</li>
            </ul>
          </div>

          <Button
            onClick={handleForceDeleteAll}
            disabled={isDeleting}
            variant="destructive"
            className="w-full"
            size="lg"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                削除中...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                すべての投稿を強制削除
              </>
            )}
          </Button>

          {result && (
            <div className={`border rounded-lg p-4 ${result.success ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <h3 className="font-semibold mb-2">削除結果</h3>
              <div className="text-sm space-y-1">
                <p>削除成功: {result.deleted}件</p>
                <p>削除方法: {result.method === 'bulk' ? '一括削除' : '個別削除'}</p>
                {result.remaining > 0 && (
                  <p className="text-orange-600">残り: {result.remaining}件</p>
                )}
                {result.failed && result.failed.length > 0 && (
                  <div className="mt-2">
                    <p className="text-red-600">失敗: {result.failed.length}件</p>
                    <details className="mt-1">
                      <summary className="cursor-pointer text-xs">詳細を表示</summary>
                      <pre className="text-xs mt-2 overflow-auto max-h-40 bg-white p-2 rounded">
                        {JSON.stringify(result.failed, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}