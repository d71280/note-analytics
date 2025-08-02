'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, XCircle, Loader2, Database, Shield, RefreshCw } from 'lucide-react'

interface TableInfo {
  table_name: string
  exists: boolean
  row_count?: number
  rls_enabled?: boolean
  error?: string
}

export default function DbCheckPage() {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')

  const requiredTables = [
    'x_api_configs',
    'x_post_history',
    'x_post_settings',
    'x_retweet_history',
    'x_retweet_settings',
    'x_search_history',
    'x_post_schedules',
    'x_scheduled_posts',
    'knowledge_base',
    'knowledge_chunks',
    'knowledge_generation_history',
    'grok_api_configs'
  ]

  const checkDatabase = async () => {
    setIsChecking(true)
    const supabase = createClient()
    const results: TableInfo[] = []

    try {
      // 接続テスト
      const { data: testData, error: testError } = await supabase
        .from('x_api_configs')
        .select('count')
        .limit(1)

      if (testError) {
        console.error('Connection test error:', testError)
        setConnectionStatus('error')
      } else {
        setConnectionStatus('connected')
      }

      // 各テーブルの存在確認
      for (const tableName of requiredTables) {
        try {
          // テーブルの存在とカウントを確認
          const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true })

          if (error) {
            results.push({
              table_name: tableName,
              exists: false,
              error: error.message
            })
          } else {
            // RLS状態を確認
            const { data: rlsData } = await supabase
              .rpc('check_rls_status', { table_name: tableName })
              .single()

            results.push({
              table_name: tableName,
              exists: true,
              row_count: count || 0,
              rls_enabled: rlsData?.rls_enabled || false
            })
          }
        } catch (err) {
          results.push({
            table_name: tableName,
            exists: false,
            error: err instanceof Error ? err.message : 'Unknown error'
          })
        }
      }

      setTables(results)
    } catch (error) {
      console.error('Database check error:', error)
      setConnectionStatus('error')
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkDatabase()
  }, [])

  const runMigration = async (tableName: string) => {
    const migrationMap: Record<string, string> = {
      'x_api_configs': '20250802_create_x_api_config_table.sql',
      'x_retweet_history': '20250802_add_retweet_tables.sql',
      'x_retweet_settings': '20250802_add_retweet_tables.sql',
      'x_search_history': '20250802_add_search_history.sql',
      'x_post_schedules': '20250802_add_post_schedules.sql',
      'x_scheduled_posts': '20250802_add_post_schedules.sql',
      'knowledge_base': '20250802_add_knowledge_base.sql',
      'knowledge_chunks': '20250802_add_knowledge_base.sql',
      'knowledge_generation_history': '20250802_add_knowledge_base.sql',
      'grok_api_configs': '20250802_add_grok_settings.sql'
    }

    const migrationFile = migrationMap[tableName]
    if (!migrationFile) {
      alert(`Migration file not found for ${tableName}`)
      return
    }

    alert(`Please run the migration file: supabase/migrations/${migrationFile} in your Supabase SQL Editor`)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Database className="h-8 w-8" />
        データベース状態確認
      </h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            接続状態
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {connectionStatus === 'checking' && (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                <span>接続確認中...</span>
              </>
            )}
            {connectionStatus === 'connected' && (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-green-600">Supabaseに接続されています</span>
              </>
            )}
            {connectionStatus === 'error' && (
              <>
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-red-600">接続エラー</span>
              </>
            )}
          </div>
          <Button
            onClick={checkDatabase}
            disabled={isChecking}
            className="mt-4"
            variant="outline"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
            再チェック
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>テーブル状態</CardTitle>
          <CardDescription>
            必要なテーブルの存在確認とRLS（Row Level Security）の状態
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tables.map((table) => (
              <div key={table.table_name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {table.exists ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium">{table.table_name}</p>
                    {table.exists && (
                      <p className="text-sm text-gray-500">
                        {table.row_count} 行 
                        {table.rls_enabled && (
                          <span className="ml-2 text-orange-500">
                            <Shield className="inline h-3 w-3" /> RLS有効
                          </span>
                        )}
                      </p>
                    )}
                    {table.error && (
                      <p className="text-sm text-red-500">{table.error}</p>
                    )}
                  </div>
                </div>
                {!table.exists && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runMigration(table.table_name)}
                  >
                    Migration確認
                  </Button>
                )}
              </div>
            ))}
          </div>

          {tables.some(t => !t.exists) && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>注意:</strong> 存在しないテーブルがあります。
                Supabaseのダッシュボードで対応するマイグレーションファイルを実行してください。
              </p>
            </div>
          )}

          {tables.some(t => t.rls_enabled) && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>RLS (Row Level Security):</strong> 一部のテーブルでRLSが有効になっています。
                適切なポリシーが設定されているか確認してください。
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>トラブルシューティング</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. テーブルが存在しない場合</h3>
            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
              <li>Supabaseダッシュボードにログイン</li>
              <li>SQL Editorを開く</li>
              <li>supabase/migrations/内の対応するSQLファイルを実行</li>
              <li>このページをリロードして確認</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2. RLSが有効な場合</h3>
            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
              <li>Supabaseダッシュボードでテーブルを選択</li>
              <li>RLSポリシーを確認</li>
              <li>必要に応じて「Allow all」ポリシーを作成</li>
              <li>または適切な認証ポリシーを設定</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold mb-2">3. 接続エラーの場合</h3>
            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
              <li>環境変数を確認（NEXT_PUBLIC_SUPABASE_URL、NEXT_PUBLIC_SUPABASE_ANON_KEY）</li>
              <li>Supabaseプロジェクトがアクティブか確認</li>
              <li>ネットワーク接続を確認</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}