'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ExternalLink, CheckCircle, AlertCircle, Download } from 'lucide-react'
import { noteAPI, extractNoteIdFromUrl, extractUsernameFromUrl } from '@/lib/api/note-api-client'

interface FetchedData {
  type: 'article' | 'user'
  data: {
    id: string
    title?: string
    excerpt?: string
    authorId?: string
    publishedAt?: string
    likeCount?: number
    commentCount?: number
    tags?: string[]
    username?: string
    displayName?: string
    bio?: string
    followerCount?: number
    followingCount?: number
    noteCount?: number
    url: string
  }
  url: string
}

interface AutoFetchProps {
  onDataFetched: (data: FetchedData) => void
}

export default function AutoFetch({ onDataFetched }: AutoFetchProps) {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [fetchResults, setFetchResults] = useState<FetchedData[]>([])
  const [error, setError] = useState<string | null>(null)

  const validateNoteUrl = (url: string): boolean => {
    return url.includes('note.com') && (url.includes('/n/') || /note\.com\/[^\/]+\/?$/.test(url))
  }

  const fetchSingleUrl = async (url: string): Promise<FetchedData | null> => {
    if (!validateNoteUrl(url)) {
      throw new Error('有効なNote.comのURLを入力してください')
    }

    const noteId = extractNoteIdFromUrl(url)
    const username = extractUsernameFromUrl(url)

    if (noteId) {
      // 記事データを取得
      const { data, error } = await noteAPI.getArticleDetail(noteId)
      if (error || !data) {
        throw new Error(`記事データの取得に失敗しました: ${error}`)
      }
      
      return {
        type: 'article',
        data: {
          id: data.id,
          title: data.title,
          excerpt: data.excerpt,
          authorId: data.authorId,
          publishedAt: data.publishedAt,
          likeCount: data.likeCount,
          commentCount: data.commentCount,
          tags: data.tags,
          url: url
        },
        url
      }
    } else if (username) {
      // ユーザーデータを取得
      const { data, error } = await noteAPI.getUserDetail(username)
      if (error || !data) {
        throw new Error(`ユーザーデータの取得に失敗しました: ${error}`)
      }

      return {
        type: 'user',
        data: {
          id: data.id,
          username: data.username,
          displayName: data.displayName,
          bio: data.bio,
          followerCount: data.followerCount,
          followingCount: data.followingCount,
          noteCount: data.noteCount,
          url: url
        },
        url
      }
    }

    return null
  }

  const handleSingleFetch = async () => {
    if (!url.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchSingleUrl(url.trim())
      if (result) {
        setFetchResults([result])
        onDataFetched(result)
        setUrl('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkFetch = async () => {
    const urls = url.split('\n').map(u => u.trim()).filter(u => u.length > 0)
    
    if (urls.length === 0) return

    setIsLoading(true)
    setError(null)
    setFetchResults([])

    const results: FetchedData[] = []
    const errors: string[] = []

    for (const singleUrl of urls) {
      try {
        const result = await fetchSingleUrl(singleUrl)
        if (result) {
          results.push(result)
          onDataFetched(result)
        }
        
        // API制限を考慮した遅延
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (err) {
        errors.push(`${singleUrl}: ${err instanceof Error ? err.message : 'エラー'}`)
      }
    }

    setFetchResults(results)
    
    if (errors.length > 0) {
      setError(`一部のURLで取得に失敗しました:\n${errors.join('\n')}`)
    }
    
    if (results.length > 0) {
      setUrl('')
    }

    setIsLoading(false)
  }

  const isBulkMode = url.includes('\n')

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            URL自動取得機能
          </CardTitle>
          <CardDescription>
            Note.comのURLを入力すると、記事やユーザー情報を自動で取得します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="auto-fetch-url">Note URL</Label>
            <Input
              id="auto-fetch-url"
              placeholder={isBulkMode 
                ? "複数のURLを改行区切りで入力\nhttps://note.com/username/n/xxxxxx1\nhttps://note.com/username/n/xxxxxx2"
                : "https://note.com/username/n/xxxxxx または https://note.com/username"
              }
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={`${isBulkMode ? 'min-h-[120px]' : ''}`}
              style={isBulkMode ? { whiteSpace: 'pre-wrap' } : {}}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                {isBulkMode 
                  ? `${url.split('\n').filter(u => u.trim()).length} 件のURLが入力されています`
                  : '単一URLまたは複数URL（改行区切り）を入力できます'
                }
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUrl('')}
                disabled={!url.trim()}
              >
                クリア
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                <div className="text-sm text-red-700 whitespace-pre-line">{error}</div>
              </div>
            </div>
          )}

          <Button
            onClick={isBulkMode ? handleBulkFetch : handleSingleFetch}
            disabled={!url.trim() || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isBulkMode ? '一括取得中...' : '取得中...'}
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                {isBulkMode ? `一括取得 (${url.split('\n').filter(u => u.trim()).length}件)` : '自動取得'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {fetchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              取得完了 ({fetchResults.length}件)
            </CardTitle>
            <CardDescription>
              以下のデータが正常に取得され、データベースに追加されました
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fetchResults.map((result, index) => (
                <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          result.type === 'article' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {result.type === 'article' ? '記事' : 'ユーザー'}
                        </span>
                        <span className="text-sm font-medium">
                          {result.type === 'article' 
                            ? result.data.title 
                            : result.data.displayName
                          }
                        </span>
                      </div>
                      
                      {result.type === 'article' ? (
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>いいね: {result.data.likeCount} | コメント: {result.data.commentCount}</div>
                          {result.data.tags && result.data.tags.length > 0 && (
                            <div>タグ: {result.data.tags.join(', ')}</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-600">
                          フォロワー: {result.data.followerCount} | 記事数: {result.data.noteCount}
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(result.url, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>サポートするURL形式</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>記事URL: </span>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                https://note.com/username/n/xxxxxx
              </code>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>ユーザーURL: </span>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                https://note.com/username
              </code>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>一括取得: 改行区切りで複数URL</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 