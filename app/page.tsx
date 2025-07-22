import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 px-4">
      <div className="w-full max-w-4xl text-center">
        <h1 className="mb-4 text-5xl font-bold text-gray-900">
          Note Analytics Platform
        </h1>
        <p className="mb-8 text-xl text-gray-600">
          Noteクリエイターのための総合分析ツール
        </p>
        <div className="mb-12 grid gap-8 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-2 text-lg font-semibold">記事分析</h3>
            <p className="text-gray-600">
              タイトルや本文を分析し、エンゲージメント向上のための提案を提供
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-2 text-lg font-semibold">クリエイター検索</h3>
            <p className="text-gray-600">
              成功しているクリエイターを検索し、そのパターンを学習
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow-lg">
            <h3 className="mb-2 text-lg font-semibold">トレンド分析</h3>
            <p className="text-gray-600">
              最新のトレンドを把握し、効果的なコンテンツ戦略を立案
            </p>
          </div>
        </div>
        <div className="flex justify-center space-x-4">
          <a
            href="/login"
            className="rounded-lg bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700"
          >
            ログイン
          </a>
          <a
            href="/register"
            className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-gray-700 hover:bg-gray-50"
          >
            新規登録
          </a>
        </div>
      </div>
    </div>
  )
}