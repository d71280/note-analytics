'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Database, AlertCircle, CheckCircle, PlayCircle } from 'lucide-react'

export default function DatabaseFixPage() {
  const [isExecuting, setIsExecuting] = useState(false)
  const [result, setResult] = useState<string>('')
  const [error, setError] = useState<string>('')

  const fixScript = `-- トリガー関数を作成
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- knowledge_baseテーブルにupdated_atカラムがない場合は追加
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'knowledge_base' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE knowledge_base ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- トリガーを作成
DROP TRIGGER IF EXISTS update_knowledge_base_updated_at ON knowledge_base;
CREATE TRIGGER update_knowledge_base_updated_at
    BEFORE UPDATE ON knowledge_base
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`

  const executeFixScript = async () => {
    setIsExecuting(true)
    setError('')
    setResult('')

    try {
      const response = await fetch('/api/admin/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: fixScript })
      })

      const data = await response.json()

      if (response.ok) {
        setResult('データベース修正が完了しました！')
      } else {
        setError(data.error || '修正に失敗しました')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">データベース修正</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            update_updated_at_column 関数修正
          </CardTitle>
          <CardDescription>
            知識ベースのアップロードエラーを修正するためのデータベーススクリプトを実行します。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">実行されるSQLスクリプト：</h3>
            <Textarea
              value={fixScript}
              readOnly
              className="h-64 font-mono text-sm"
            />
          </div>

          <Button 
            onClick={executeFixScript}
            disabled={isExecuting}
            className="w-full"
          >
            {isExecuting ? (
              <>
                <PlayCircle className="mr-2 h-4 w-4 animate-spin" />
                実行中...
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                修正スクリプトを実行
              </>
            )}
          </Button>

          {result && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">{result}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-semibold">エラー: {error}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}