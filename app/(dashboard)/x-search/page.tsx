'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, RefreshCw, Heart, MessageCircle, Repeat2, Loader2, CheckCircle2, Sparkles, Send, ArrowUpDown, AlertCircle, Settings } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'

interface Tweet {
  id: string
  text: string
  author: {
    name: string
    username: string
    profile_image_url?: string
  }
  created_at: string
  metrics: {
    like_count: number
    retweet_count: number
    reply_count: number
  }
  url: string
}

export default function XSearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [retweetedIds, setRetweetedIds] = useState<Set<string>>(new Set())
  const [retweetingId, setRetweetingId] = useState<string | null>(null)
  const [selectedTweet, setSelectedTweet] = useState<Tweet | null>(null)
  const [generatingResponse, setGeneratingResponse] = useState(false)
  const [generatedResponse, setGeneratedResponse] = useState('')
  const [postingResponse, setPostingResponse] = useState(false)
  const [sortByImpressions, setSortByImpressions] = useState(true)
  const [filters, setFilters] = useState({
    minLikes: 0,
    minRetweets: 0,
    minReplies: 0,
    includeRetweets: false,
    language: '',
    minImpressions: 0,
    hasMedia: false,
    isVerified: false,
    dateFrom: '',
    dateTo: ''
  })

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch('/api/x/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          maxResults: 20,
          ...filters
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Search API error:', errorData)
        if (response.status === 404) {
          alert('X API設定が見つかりません。設定ページでAPI情報を設定してください。')
        } else if (response.status === 401) {
          if (confirm('X APIの認証エラーです。アクセストークンが無効または期限切れです。\n\n設定ページに移動して再設定しますか？')) {
            window.location.href = '/settings?tab=x'
          }
        } else {
          alert(errorData.error || '検索エラーが発生しました')
        }
        return
      }
      
      const data = await response.json()
      if (data.tweets) {
        setTweets(data.tweets)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleRetweet = async (tweetId: string) => {
    setRetweetingId(tweetId)
    try {
      const response = await fetch('/api/x/retweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tweetId,
          action: 'retweet'
        })
      })

      if (response.ok) {
        setRetweetedIds(new Set(Array.from(retweetedIds).concat(tweetId)))
      }
    } catch (error) {
      console.error('Retweet error:', error)
    } finally {
      setRetweetingId(null)
    }
  }

  const handleBatchRetweet = async () => {
    const unretweetedTweets = tweets.filter(tweet => !retweetedIds.has(tweet.id))
    
    for (const tweet of unretweetedTweets) {
      await handleRetweet(tweet.id)
      // 1秒の遅延を入れてレート制限を回避
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const generateResponse = async (tweet: Tweet) => {
    setGeneratingResponse(true)
    setSelectedTweet(tweet)
    
    try {
      const response = await fetch('/api/knowledge/generate-tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `以下のツイートに対して、知識ベースを活用して価値のある返信を生成してください：\n\n"${tweet.text}"\n\n著者: @${tweet.author.username}`,
          useKnowledge: true
        })
      })

      const data = await response.json()
      if (data.tweet) {
        setGeneratedResponse(data.tweet)
      }
    } catch (error) {
      console.error('Generate response error:', error)
      alert('レスポンス生成に失敗しました')
    } finally {
      setGeneratingResponse(false)
    }
  }

  const postResponse = async () => {
    if (!generatedResponse || !selectedTweet) return
    
    setPostingResponse(true)
    
    try {
      const response = await fetch('/api/x/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: generatedResponse,
          replyToId: selectedTweet.id
        })
      })

      if (response.ok) {
        alert('返信を投稿しました')
        setGeneratedResponse('')
        setSelectedTweet(null)
      } else {
        throw new Error('Post failed')
      }
    } catch (error) {
      console.error('Post response error:', error)
      alert('投稿に失敗しました')
    } finally {
      setPostingResponse(false)
    }
  }

  // インプレッション数でソート
  const sortedTweets = sortByImpressions 
    ? [...tweets].sort((a, b) => {
        const impressionsA = a.metrics.like_count + a.metrics.retweet_count * 2 + a.metrics.reply_count
        const impressionsB = b.metrics.like_count + b.metrics.retweet_count * 2 + b.metrics.reply_count
        return impressionsB - impressionsA
      })
    : tweets

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Xキーワード検索 & リポスト</h1>

      {/* API設定の確認を促すメッセージ */}
      <Card className="mb-6 border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-yellow-800">
                <strong>X API設定の確認：</strong>
                検索機能を使用するには、有効なX APIの設定が必要です。
              </p>
              <Link href="/settings?tab=x" className="inline-flex items-center gap-1 mt-2 text-sm text-yellow-700 hover:text-yellow-900 underline">
                <Settings className="h-4 w-4" />
                設定ページでX APIを設定する
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            キーワード検索
          </CardTitle>
          <CardDescription>
            特定のキーワードを含むツイートを検索してリポストできます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="検索キーワードを入力（例: #note, @username, keyword）"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button 
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    検索中...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    検索
                  </>
                )}
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>最小いいね数</Label>
                <Input
                  type="number"
                  min="0"
                  value={filters.minLikes}
                  onChange={(e) => setFilters({
                    ...filters,
                    minLikes: parseInt(e.target.value) || 0
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>最小リツイート数</Label>
                <Input
                  type="number"
                  min="0"
                  value={filters.minRetweets}
                  onChange={(e) => setFilters({
                    ...filters,
                    minRetweets: parseInt(e.target.value) || 0
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>最小返信数</Label>
                <Input
                  type="number"
                  min="0"
                  value={filters.minReplies}
                  onChange={(e) => setFilters({
                    ...filters,
                    minReplies: parseInt(e.target.value) || 0
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>言語</Label>
                <select
                  value={filters.language}
                  onChange={(e) => setFilters({
                    ...filters,
                    language: e.target.value
                  })}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
                >
                  <option value="">すべての言語</option>
                  <option value="ja">日本語</option>
                  <option value="en">英語</option>
                  <option value="ko">韓国語</option>
                  <option value="zh">中国語</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>最小インプレッション数</Label>
                <Input
                  type="number"
                  min="0"
                  value={filters.minImpressions}
                  onChange={(e) => setFilters({
                    ...filters,
                    minImpressions: parseInt(e.target.value) || 0
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>日付範囲（開始）</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({
                    ...filters,
                    dateFrom: e.target.value
                  })}
                />
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.includeRetweets}
                  onChange={(e) => setFilters({
                    ...filters,
                    includeRetweets: e.target.checked
                  })}
                  className="rounded"
                />
                <span className="text-sm">リツイートも表示</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.hasMedia}
                  onChange={(e) => setFilters({
                    ...filters,
                    hasMedia: e.target.checked
                  })}
                  className="rounded"
                />
                <span className="text-sm">メディア付きのみ</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.isVerified}
                  onChange={(e) => setFilters({
                    ...filters,
                    isVerified: e.target.checked
                  })}
                  className="rounded"
                />
                <span className="text-sm">認証済みアカウントのみ</span>
              </label>
              <div className="space-y-1">
                <Label className="text-sm">日付範囲（終了）</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({
                    ...filters,
                    dateTo: e.target.value
                  })}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {tweets.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              検索結果: {tweets.length}件
            </h2>
            <div className="flex gap-2">
              <Button
                onClick={() => setSortByImpressions(!sortByImpressions)}
                variant="outline"
                size="sm"
              >
                <ArrowUpDown className="mr-2 h-4 w-4" />
                {sortByImpressions ? 'インプレッション順' : '時系列順'}
              </Button>
              <Button
                onClick={handleBatchRetweet}
                variant="outline"
                disabled={tweets.every(tweet => retweetedIds.has(tweet.id))}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                全てリツイート
              </Button>
            </div>
          </div>

          {sortedTweets.map((tweet) => (
            <Card key={tweet.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {tweet.author.profile_image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={tweet.author.profile_image_url}
                          alt={tweet.author.name}
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <div>
                        <p className="font-semibold">{tweet.author.name}</p>
                        <p className="text-sm text-gray-500">@{tweet.author.username}</p>
                      </div>
                    </div>
                    <p className="text-sm mb-3 whitespace-pre-wrap">{tweet.text}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {tweet.metrics.like_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Repeat2 className="h-4 w-4" />
                        {tweet.metrics.retweet_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {tweet.metrics.reply_count}
                      </span>
                      <span className="text-xs">
                        {formatDate(tweet.created_at)}
                      </span>
                      <span className="text-xs font-semibold text-blue-600">
                        概算インプレッション: {tweet.metrics.like_count + tweet.metrics.retweet_count * 2 + tweet.metrics.reply_count}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => generateResponse(tweet)}
                      disabled={generatingResponse}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {generatingResponse && selectedTweet?.id === tweet.id ? (
                        <>
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-1 h-4 w-4" />
                          返信を生成
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant={retweetedIds.has(tweet.id) ? "secondary" : "outline"}
                      onClick={() => handleRetweet(tweet.id)}
                      disabled={retweetingId === tweet.id || retweetedIds.has(tweet.id)}
                    >
                      {retweetingId === tweet.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : retweetedIds.has(tweet.id) ? (
                        <>
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                          リポスト済み
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-1 h-4 w-4" />
                          そのままリポスト
                        </>
                      )}
                    </Button>
                    <a
                      href={tweet.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline text-center"
                    >
                      元のツイート
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tweets.length === 0 && !isSearching && (
        <div className="text-center py-12 text-gray-500">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>キーワードを入力して検索してください</p>
        </div>
      )}

      {/* 知識ベース活用返信生成・編集・投稿セクション */}
      {selectedTweet && generatedResponse && (
        <Card className="mt-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              知識ベース活用返信
            </CardTitle>
            <CardDescription>
              <span className="text-blue-700">
                @{selectedTweet.author.username} への返信（知識ベースから生成）
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-white rounded-lg border border-blue-200">
              <div className="flex items-start gap-3 mb-3">
                {selectedTweet.author.profile_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedTweet.author.profile_image_url}
                    alt={selectedTweet.author.name}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold">{selectedTweet.author.name}</p>
                  <p className="text-sm text-gray-600">@{selectedTweet.author.username}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed">{selectedTweet.text}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {selectedTweet.metrics.like_count}
                </span>
                <span className="flex items-center gap-1">
                  <Repeat2 className="h-3 w-3" />
                  {selectedTweet.metrics.retweet_count}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  {selectedTweet.metrics.reply_count}
                </span>
              </div>
            </div>
            
            <div>
              <Label htmlFor="response" className="text-blue-800 font-semibold">
                🧠 知識ベース活用返信（編集可能）
              </Label>
              <Textarea
                id="response"
                value={generatedResponse}
                onChange={(e) => setGeneratedResponse(e.target.value)}
                rows={6}
                className="mt-2 border-blue-300 focus:border-blue-500"
                maxLength={280}
                placeholder="知識ベースを活用した返信を生成しています..."
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-blue-600">
                  💡 あなたの知識ベースから関連情報を自動抽出して作成
                </p>
                <p className="text-xs text-gray-500">
                  {generatedResponse.length}/280文字
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={postResponse}
                disabled={postingResponse || !generatedResponse}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {postingResponse ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    投稿中...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    返信を投稿
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => generateResponse(selectedTweet)}
                disabled={generatingResponse}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                {generatingResponse ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    再生成中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    再生成
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setGeneratedResponse('')
                  setSelectedTweet(null)
                }}
                className="border-gray-300"
              >
                キャンセル
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}