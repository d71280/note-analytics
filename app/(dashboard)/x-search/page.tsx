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
  const [useMockData, setUseMockData] = useState(true) // X API制限回避のためデフォルトでモック使用
  const [filters, setFilters] = useState({
    minLikes: 0,
    minRetweets: 0,
    includeRetweets: false
  })

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const endpoint = useMockData ? '/api/x/search-mock' : '/api/x/search'
      const response = await fetch(endpoint, {
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

            <div className="grid gap-4 md:grid-cols-3">
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
                <Label>リツイートを含む</Label>
                <label className="flex items-center space-x-2 mt-2">
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
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-blue-800">モックデータ使用</p>
                  <p className="text-xs text-blue-600">X API制限回避のためサンプルデータを表示</p>
                </div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={useMockData}
                    onChange={(e) => setUseMockData(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-blue-800">有効</span>
                </label>
              </div>
              
              {!useMockData && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>警告:</strong> X API無料プランは月450リクエストの制限があります。
                    実際のAPIを使用すると制限にすぐ達する可能性があります。
                  </p>
                </div>
              )}
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
                      {sortByImpressions && (
                        <span className="text-xs font-semibold text-blue-600">
                          インプレッション: {tweet.metrics.like_count + tweet.metrics.retweet_count * 2 + tweet.metrics.reply_count}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant={retweetedIds.has(tweet.id) ? "secondary" : "default"}
                      onClick={() => handleRetweet(tweet.id)}
                      disabled={retweetingId === tweet.id || retweetedIds.has(tweet.id)}
                    >
                      {retweetingId === tweet.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : retweetedIds.has(tweet.id) ? (
                        <>
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                          済み
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-1 h-4 w-4" />
                          リツイート
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => generateResponse(tweet)}
                      disabled={generatingResponse}
                    >
                      {generatingResponse && selectedTweet?.id === tweet.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="mr-1 h-4 w-4" />
                          返信生成
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

      {/* 返信生成・編集・投稿セクション */}
      {selectedTweet && generatedResponse && (
        <Card className="mt-8 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              生成された返信
            </CardTitle>
            <CardDescription>
              @{selectedTweet.author.username} への返信
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">元のツイート:</p>
              <p className="text-sm">{selectedTweet.text.substring(0, 100)}...</p>
            </div>
            
            <div>
              <Label htmlFor="response">返信内容（編集可能）</Label>
              <Textarea
                id="response"
                value={generatedResponse}
                onChange={(e) => setGeneratedResponse(e.target.value)}
                rows={4}
                className="mt-1"
                maxLength={280}
              />
              <p className="text-xs text-gray-500 mt-1">
                {generatedResponse.length}/280文字
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={postResponse}
                disabled={postingResponse || !generatedResponse}
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
                onClick={() => {
                  setGeneratedResponse('')
                  setSelectedTweet(null)
                }}
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