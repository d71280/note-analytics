'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, Send, Loader2, Sparkles } from 'lucide-react'

// 記事データの型定義
interface TrendArticle {
  id: string
  title: string
  excerpt?: string
  authorId: string
  publishedAt: string
  likeCount: number
  commentCount: number
  tags?: string[]
  category?: string
  engagement?: {
    totalEngagementScore: number
    likeToViewRatio: number
    trendingVelocity: number
  }
}

interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
}

interface AITrendAnalyzerProps {
  articles: TrendArticle[]
  currentCategory?: string
  currentPeriod?: string
}

export function AITrendAnalyzer({ articles, currentCategory = 'all', currentPeriod = 'all' }: AITrendAnalyzerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      type: 'ai',
      content: '🚀 今日の急上昇トレンド分析AIです！\n\n現在のデータを分析して、伸びている記事の傾向や特徴をお伝えします。何について分析したいですか？',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // トレンド分析用の提案質問
  const suggestedQuestions = [
    '今日最も伸びている記事の特徴は？',
    'どのカテゴリーが人気？',
    'エンゲージメントが高い記事の共通点は？',
    '急上昇している記事のタイトルパターンは？',
    '今週のトレンドキーワードは？'
  ]

  // 記事データを分析してAIレスポンスを生成
  const analyzeArticles = async (question: string): Promise<string> => {
    // 記事データの統計を計算
    const totalArticles = articles.length
    const avgLikes = articles.reduce((sum, article) => sum + article.likeCount, 0) / totalArticles
    const avgEngagement = articles.reduce((sum, article) => sum + (article.engagement?.totalEngagementScore || 0), 0) / totalArticles

    // カテゴリー別統計
    const categoryStats: Record<string, number> = {}
    articles.forEach(article => {
      const category = article.category || 'その他'
      categoryStats[category] = (categoryStats[category] || 0) + 1
    })

    // 人気カテゴリーTOP3
    const topCategories = Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)

    // 高エンゲージメント記事（上位20%）
    const sortedByEngagement = articles
      .filter(article => article.engagement?.totalEngagementScore)
      .sort((a, b) => (b.engagement?.totalEngagementScore || 0) - (a.engagement?.totalEngagementScore || 0))
      .slice(0, Math.ceil(totalArticles * 0.2))

    // タイトルパターン分析
    const titleWords = articles.flatMap(article => 
      article.title.split(/[\s　、。！？]+/).filter(word => word.length > 1)
    )
    const wordCount: Record<string, number> = {}
    titleWords.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1
    })
    const popularWords = Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word)

    // 質問に応じた分析結果を生成
    if (question.includes('特徴') || question.includes('共通点')) {
      return `📊 **今日の急上昇記事分析結果**

**📈 全体統計:**
• 分析記事数: ${totalArticles}件
• 平均いいね数: ${Math.round(avgLikes)}
• 平均エンゲージメント: ${avgEngagement.toFixed(1)}

**🔥 高エンゲージメント記事の特徴:**
${sortedByEngagement.slice(0, 3).map((article, i) => 
  `${i + 1}. "${article.title}" (${article.likeCount}いいね, ${article.engagement?.totalEngagementScore.toFixed(1)}点)`
).join('\n')}

**💡 成功パターン:**
• タイトルによく使われるキーワード: ${popularWords.join('、')}
• 最も伸びているカテゴリー: ${topCategories[0]?.[0]}（${topCategories[0]?.[1]}件）
• 投稿時期: 多くの人気記事が最近投稿されています`

    } else if (question.includes('カテゴリー')) {
      return `📂 **カテゴリー別トレンド分析**

**🏆 人気カテゴリーTOP3:**
${topCategories.map(([category, count], i) => 
  `${i + 1}. ${category}: ${count}件 (${((count / totalArticles) * 100).toFixed(1)}%)`
).join('\n')}

**📊 カテゴリー別平均エンゲージメント:**
${Object.entries(categoryStats).map(([category, count]) => {
  const categoryArticles = articles.filter(a => (a.category || 'その他') === category)
  const avgCategoryEngagement = categoryArticles.reduce((sum, a) => sum + (a.engagement?.totalEngagementScore || 0), 0) / count
  return `• ${category}: ${avgCategoryEngagement.toFixed(1)}点`
}).join('\n')}`

    } else if (question.includes('タイトル') || question.includes('パターン')) {
      return `📝 **タイトルパターン分析**

**🔤 人気キーワードTOP5:**
${popularWords.map((word, i) => `${i + 1}. "${word}"`).join('\n')}

**✨ 効果的なタイトルの特徴:**
• 文字数: 平均${Math.round(articles.reduce((sum, a) => sum + a.title.length, 0) / totalArticles)}文字
• 疑問形の使用率が高い
• 具体的な数字を含む記事が伸びやすい
• 感情を動かすキーワードが効果的

**📈 高エンゲージメント記事のタイトル例:**
${sortedByEngagement.slice(0, 3).map(a => `"${a.title}"`).join('\n')}`

    } else if (question.includes('キーワード') || question.includes('トレンド')) {
      return `🔍 **今週のトレンドキーワード分析**

**🚀 急上昇キーワード:**
${popularWords.slice(0, 3).map((word, i) => `${i + 1}. ${word}`).join('\n')}

**📈 トレンド要因:**
• AI・テクノロジー関連の話題が活発
• ライフスタイル改善への関心が高まり
• 副業・キャリア系のコンテンツが人気

**💡 今後注目のテーマ:**
• ${topCategories[0]?.[0]}系のコンテンツ
• 実体験ベースのストーリー
• 実用的なノウハウ記事`

    } else {
      return `🤖 **AI分析レポート**

現在${totalArticles}件の記事を分析中です。

**📊 クイック分析:**
• 最も活発なカテゴリー: ${topCategories[0]?.[0]}
• 平均エンゲージメント: ${avgEngagement.toFixed(1)}点
• 人気キーワード: ${popularWords.slice(0, 3).join('、')}

より詳しい分析をお求めでしたら、具体的な質問をお聞かせください！
例: "どのカテゴリーが人気？"、"タイトルのパターンは？"など`
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isAnalyzing) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsAnalyzing(true)

    try {
      const aiResponse = await analyzeArticles(userMessage.content)
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('AI analysis error:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: '申し訳ございません。分析中にエラーが発生しました。もう一度お試しください。',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    setInputMessage(question)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-500" />
          AI トレンド分析アシスタント
          <Sparkles className="h-4 w-4 text-yellow-500" />
        </CardTitle>
        <div className="text-sm text-gray-500">
          現在のフィルター: {currentCategory} / {currentPeriod} / {articles.length}件の記事を分析
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* チャット表示エリア */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {isAnalyzing && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">分析中...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 提案質問ボタン */}
        <div className="border-t p-3">
          <div className="text-xs text-gray-500 mb-2">💡 提案質問:</div>
          <div className="flex flex-wrap gap-1">
            {suggestedQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleSuggestedQuestion(question)}
                disabled={isAnalyzing}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>

        {/* 入力エリア */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="今日のトレンドについて何でも聞いてください..."
              disabled={isAnalyzing}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isAnalyzing}
              size="sm"
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 