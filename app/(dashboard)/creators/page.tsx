'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, TrendingUp, Loader2, ExternalLink, Users } from 'lucide-react'
import { noteAPI, NoteUser } from '@/lib/api/note-api-client'

interface CreatorData {
  creators: NoteUser[]
  loading: boolean
  error: string | null
  searchQuery: string
  selectedCategory: string
  sortBy: string
}

export default function CreatorsPage() {
  const [creatorData, setCreatorData] = useState<CreatorData>({
    creators: [],
    loading: true,
    error: null,
    searchQuery: '',
    selectedCategory: 'all',
    sortBy: 'followers'
  })

  // 人気クリエイターを取得
  const fetchPopularCreators = async () => {
    setCreatorData(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await noteAPI.getPopularCreators(100)
      
      if (response.error) {
        throw new Error(response.error)
      }

      setCreatorData(prev => ({
        ...prev,
        creators: response.data || [],
        loading: false,
        error: null
      }))
    } catch (error) {
      setCreatorData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '不明なエラーが発生しました'
      }))
    }
  }

  // クリエイター検索
  const searchCreators = async (query: string) => {
    if (!query.trim()) {
      fetchPopularCreators()
      return
    }

    setCreatorData(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await noteAPI.searchUsers(query.trim(), 10)
      
      if (response.error) {
        throw new Error(response.error)
      }

      setCreatorData(prev => ({
        ...prev,
        creators: response.data || [],
        loading: false,
        error: null
      }))
    } catch (error) {
      setCreatorData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '検索に失敗しました'
      }))
    }
  }

  // 検索処理
  const handleSearch = () => {
    searchCreators(creatorData.searchQuery)
  }

  // カテゴリー変更
  const handleCategoryChange = (category: string) => {
    setCreatorData(prev => ({ ...prev, selectedCategory: category }))
    if (category === 'all') {
      fetchPopularCreators()
    } else {
      searchCreators(category)
    }
  }

  // ソート処理
  const sortCreators = (creators: NoteUser[], sortBy: string) => {
    const sorted = [...creators]
    
    switch (sortBy) {
      case 'followers':
        return sorted.sort((a, b) => (b.followerCount || 0) - (a.followerCount || 0))
      case 'notes':
        return sorted.sort((a, b) => (b.noteCount || 0) - (a.noteCount || 0))
      case 'following':
        return sorted.sort((a, b) => (b.followingCount || 0) - (a.followingCount || 0))
      default:
        return sorted
    }
  }

  const handleSortChange = (sortBy: string) => {
    setCreatorData(prev => ({ ...prev, sortBy }))
  }

  // 初期読み込み
  useEffect(() => {
    fetchPopularCreators()
  }, [])

  const sortedCreators = sortCreators(creatorData.creators, creatorData.sortBy)

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">クリエイター検索</h1>
          <p className="text-gray-600">実際のNote APIから取得したクリエイター情報</p>
        </div>
        <Button onClick={fetchPopularCreators} disabled={creatorData.loading}>
          {creatorData.loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              更新中
            </>
          ) : (
            <>
              <Users className="h-4 w-4 mr-2" />
              人気クリエイター
            </>
          )}
        </Button>
      </div>
      
      <div className="mb-8">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="クリエイター名やキーワードで検索..."
              className="w-full"
              value={creatorData.searchQuery}
              onChange={(e) => setCreatorData(prev => ({ ...prev, searchQuery: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch()
                }
              }}
            />
          </div>
          <Button onClick={handleSearch} disabled={creatorData.loading}>
            {creatorData.loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            検索
          </Button>
        </div>
      </div>

      <div className="mb-6 flex gap-4">
        <select 
          className="rounded-md border border-gray-300 px-4 py-2"
          value={creatorData.selectedCategory}
          onChange={(e) => handleCategoryChange(e.target.value)}
        >
          <option value="all">すべてのカテゴリー</option>
          <option value="ビジネス">ビジネス</option>
          <option value="テクノロジー">テクノロジー</option>
          <option value="ライフスタイル">ライフスタイル</option>
          <option value="AI">AI・テクノロジー</option>
          <option value="プログラミング">プログラミング</option>
        </select>
        <select 
          className="rounded-md border border-gray-300 px-4 py-2"
          value={creatorData.sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
        >
          <option value="followers">フォロワー数順</option>
          <option value="notes">記事数順</option>
          <option value="following">フォロー数順</option>
        </select>
      </div>

      {creatorData.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="text-red-600">⚠️</div>
            <div>
              <p className="text-sm font-medium text-red-800 mb-1">データ取得エラー</p>
              <p className="text-sm text-red-700">{creatorData.error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchPopularCreators}
                className="mt-2"
              >
                再試行
              </Button>
            </div>
          </div>
        </div>
      )}

      {creatorData.loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>クリエイターデータを取得中...</span>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedCreators.map((creator, index) => (
            <Card key={`${creator.id}-${index}`} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                      {creator.displayName.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{creator.displayName}</CardTitle>
                      <CardDescription>@{creator.username}</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(creator.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                                 {creator.bio && (
                   <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                     {creator.bio.length > 80 ? `${creator.bio.substring(0, 80)}...` : creator.bio}
                   </p>
                 )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">フォロワー</span>
                    <span className="font-semibold">{(creator.followerCount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">記事数</span>
                    <span className="font-semibold">{(creator.noteCount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">フォロー数</span>
                    <span className="font-semibold">{(creator.followingCount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">エンゲージメント率</span>
                    <div className="flex items-center text-green-600">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span className="font-semibold">
                        {creator.followerCount > 0 
                          ? ((creator.noteCount || 0) / creator.followerCount * 100).toFixed(1)
                          : '0.0'
                        }%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!creatorData.loading && sortedCreators.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            クリエイターが見つかりませんでした
          </h3>
          <p className="text-gray-600 mb-4">
            検索条件を変更するか、別のキーワードで検索してみてください。
          </p>
          <Button onClick={fetchPopularCreators}>
            <Users className="h-4 w-4 mr-2" />
            人気クリエイターを表示
          </Button>
        </div>
      )}

      {!creatorData.loading && sortedCreators.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            {sortedCreators.length}件のクリエイターが見つかりました
          </p>
        </div>
      )}
    </div>
  )
}