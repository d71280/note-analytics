'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, RefreshCw, Heart, MessageCircle, Repeat2, Loader2, CheckCircle2 } from 'lucide-react'

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
  const [filters, setFilters] = useState({
    minLikes: 0,
    minRetweets: 0,
    includeRetweets: false
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

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Xキーワード検索 & リポスト</h1>

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
          </div>
        </CardContent>
      </Card>

      {tweets.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              検索結果: {tweets.length}件
            </h2>
            <Button
              onClick={handleBatchRetweet}
              variant="outline"
              disabled={tweets.every(tweet => retweetedIds.has(tweet.id))}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              全てリツイート
            </Button>
          </div>

          {tweets.map((tweet) => (
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
    </div>
  )
}