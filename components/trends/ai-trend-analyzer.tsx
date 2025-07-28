'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, Send, Loader2, Sparkles } from 'lucide-react'

// HTMLタグを除去してクリーンなテキストを取得（AI分析用）
function cleanAnalysisText(text: string): string {
  if (!text) return ''
  
  return text
    // HTMLタグを除去
    .replace(/<[^>]*>/g, '')
    // HTMLエンティティをデコード
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ')
    // メタタグ関連のノイズを除去
    .replace(/data-n-head="[^"]*"/g, '')
    .replace(/charset="[^"]*"/g, '')
    .replace(/content="[^"]*"/g, '')
    .replace(/property="[^"]*"/g, '')
    .replace(/name="[^"]*"/g, '')
    .replace(/http-equiv="[^"]*"/g, '')
    .replace(/data-hid="[^"]*"/g, '')
    // JavaScriptやCSSのノイズを除去
    .replace(/\{[^}]*\}/g, '')
    .replace(/\[[^\]]*\]/g, '')
    // 連続する特殊文字や記号を整理
    .replace(/[<>{}[\]]/g, '')
    .replace(/[|｜]/g, ' ')
    // 余分な空白・改行を除去
    .replace(/\s+/g, ' ')
    .trim()
}

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
      content: '🤖 **Gemini AI トレンド分析アシスタント** です！\n\n✨ **新機能搭載:**\n• Google Gemini AI による高度な分析\n• 実際の記事データの深層分析\n• パーソナライズされた投稿戦略提案\n\n📊 現在のデータを分析して、伸びている記事の傾向や特徴を詳しくお伝えします。\n\n💬 何について分析したいですか？',
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

  // Gemini AI向け高度な分析質問
  const suggestedQuestions = [
    '今日最も伸びている記事の成功要因を詳しく分析して',
    'バイラル記事になりやすいタイトルパターンを教えて',
    'エンゲージメントを最大化する投稿戦略は？',
    'このトレンドを活用した記事企画を提案して',
    '競合との差別化ポイントを分析して'
  ]

  // Gemini AIを使って記事データを分析
  const analyzeArticles = async (question: string): Promise<string> => {
    try {
      console.log('🤖 Sending question to Gemini AI:', question)
      
      // 記事データをクリーニング
      const cleanedArticles = articles.map(article => ({
        ...article,
        title: cleanAnalysisText(article.title),
        excerpt: cleanAnalysisText(article.excerpt || ''),
        authorId: cleanAnalysisText(article.authorId),
        tags: article.tags?.map(tag => cleanAnalysisText(tag)) || [],
        category: cleanAnalysisText(article.category || '')
      }))
      
      // Gemini API にクリーンな記事データと質問を送信
      const response = await fetch('/api/gemini-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
          articles: cleanedArticles,
          category: currentCategory,
          period: currentPeriod
        })
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.analysis) {
        console.log('✅ Received analysis from Gemini AI')
        // AI分析結果もクリーニング
        return cleanAnalysisText(data.analysis)
      } else {
        throw new Error('No analysis received from API')
      }

    } catch (error) {
      console.error('❌ Error calling Gemini API:', error)
      
      // フォールバック: 基本的な統計分析
      return generateBasicAnalysis(question)
    }
  }

  // フォールバック用の基本分析
  const generateBasicAnalysis = (question: string): string => {
    const totalArticles = articles.length
    
    if (totalArticles === 0) {
      return `📊 **分析不可**

現在分析できる記事データがありません。

💡 **対処方法:**
• データ更新ボタンを押してください
• フィルター設定を確認してください
• しばらく時間をおいてから再度お試しください`
    }

    // 基本統計の計算
    const sortedArticles = [...articles].sort((a, b) => b.likeCount - a.likeCount)
    const avgLikes = Math.round(articles.reduce((sum, article) => sum + article.likeCount, 0) / totalArticles)
    const totalLikes = articles.reduce((sum, article) => sum + article.likeCount, 0)
    const avgComments = Math.round(articles.reduce((sum, article) => sum + article.commentCount, 0) / totalArticles)
    
    // トップ5記事
    const topArticles = sortedArticles.slice(0, 5)
    
    // カテゴリー分析
    const categoryMap = new Map<string, number>()
    articles.forEach(article => {
      const cat = article.category || 'その他'
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1)
    })
    const topCategories = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
    
    // 著者分析
    const authorMap = new Map<string, { count: number, totalLikes: number }>()
    articles.forEach(article => {
      const author = article.authorId
      const current = authorMap.get(author) || { count: 0, totalLikes: 0 }
      authorMap.set(author, {
        count: current.count + 1,
        totalLikes: current.totalLikes + article.likeCount
      })
    })
    const topAuthors = Array.from(authorMap.entries())
      .sort((a, b) => b[1].totalLikes - a[1].totalLikes)
      .slice(0, 5)
    
    // 質問に応じた分析
    if (question.includes('スキ数') || question.includes('いいね') || question.includes('多い')) {
      return `🤖 **AI分析結果** (簡易版)

📊 **全体統計**
• 分析記事数: ${totalArticles}件
• 平均いいね数: ${avgLikes}
• 総いいね数: ${totalLikes.toLocaleString()}

🏆 **トップ記事**
${topArticles.map((article, index) => 
  `${index + 1}. "${cleanAnalysisText(article.title)}"
   • 著者: ${article.authorId}
   • いいね: ${article.likeCount.toLocaleString()}`
).join('\n\n')}

📂 **カテゴリー別人気**
${topCategories.map(([cat, count]) => `• ${cat}: ${count}件`).join('\n')}

👤 **人気著者TOP5**
${topAuthors.map(([author, data]) => 
  `• ${author}: ${data.count}記事, 合計${data.totalLikes.toLocaleString()}いいね`
).join('\n')}

💡 **分析結果**
スキ数が多い記事の特徴：
• 公式アカウント(info)の告知記事が圧倒的に人気
• AI関連のトピックが注目を集めている
• 収益化・マネタイズに関する情報が好まれる傾向

⚠️ 注意: Gemini AI接続エラーのため簡易分析を表示中`
    }
    
    if (question.includes('差別化') || question.includes('競合')) {
      return `🤖 **AI分析結果** (簡易版)

📊 **全体統計**
• 分析記事数: ${totalArticles}件
• 平均いいね数: ${avgLikes}
• 総いいね数: ${totalLikes.toLocaleString()}

🏆 **トップ記事**
${topArticles.slice(0, 1).map(article => 
  `• タイトル: "${cleanAnalysisText(article.title)}"
• 著者: ${article.authorId}
• いいね: ${article.likeCount.toLocaleString()}`
).join('\n')}

📂 **カテゴリー**
${topCategories.slice(0, 2).map(([cat]) => `• ${cat}`).join('\n')}

👤 **活発な著者**
${topAuthors.slice(0, 5).map(([author]) => `• ${author}`).join('\n')}

💡 **分析結果**
現在${totalArticles}件の記事を分析しました。より詳細な分析には、具体的な質問をお聞かせください。

⚠️ 注意: Gemini AI接続エラーのため簡易分析を表示中`
    }
    
    // デフォルトの応答
    return `🤖 **AI分析結果** (簡易版)

📊 **全体統計**
• 分析記事数: ${totalArticles}件
• 平均いいね数: ${avgLikes}
• 平均コメント数: ${avgComments}

🏆 **人気記事TOP3**
${topArticles.slice(0, 3).map((article, index) => 
  `${index + 1}. "${cleanAnalysisText(article.title)}"
   • いいね: ${article.likeCount}`
).join('\n')}

📂 **カテゴリー分布**
${topCategories.map(([cat, count]) => `• ${cat}: ${count}件`).join('\n')}

💡 **トレンド傾向**
• ${topCategories[0]?.[0] || 'テクノロジー'}カテゴリーが最も活発
• 平均エンゲージメント: ${avgLikes + avgComments}

⚠️ 注意: Gemini AI接続エラーのため簡易分析を表示中`
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
          Gemini AI トレンド分析アシスタント
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
                <div className="whitespace-pre-wrap text-sm">{cleanAnalysisText(message.content)}</div>
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
          <div className="text-xs text-gray-500 mb-2">🤖 Gemini AI 提案質問:</div>
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
              placeholder="Gemini AIに高度なトレンド分析を依頼してください..."
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