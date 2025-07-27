import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_KEY = 'AIzaSyADSPuDzF28H6u8NsWY217Foij9txK8PcU'
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'

interface ArticleData {
  id: string
  title: string
  authorId: string
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

export async function POST(request: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any = {}
  
  try {
    body = await request.json()
    const { question, articles, category, period } = body

    console.log('🤖 Gemini Analysis Request:', { 
      question: question?.substring(0, 50) + '...', 
      articlesCount: articles?.length,
      category,
      period 
    })

    if (!question || !articles) {
      return NextResponse.json(
        { error: 'Question and articles are required' },
        { status: 400 }
      )
    }

    // APIキーの検証
    if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 20) {
      console.warn('⚠️ Gemini API key not configured, using fallback')
      return generateFallbackResponse(articles, question, category, period)
    }

    // 記事データを分析用に要約
    const articleSummary = articles.slice(0, 20).map((article: ArticleData) => ({
      title: article.title,
      author: article.authorId,
      likes: article.likeCount,
      comments: article.commentCount,
      category: article.category,
      tags: article.tags?.slice(0, 3),
      engagement: article.engagement?.totalEngagementScore
    }))

    // Gemini APIへのプロンプト構築
    const prompt = `
あなたはNote.comのトレンド分析の専門家です。以下の実際の記事データを分析して、ユーザーの質問に日本語で詳しく回答してください。

【分析対象データ】
カテゴリー: ${category || 'すべて'}
期間: ${period || 'すべて'}
記事数: ${articles.length}件

【記事データ】
${JSON.stringify(articleSummary, null, 2)}

【ユーザーの質問】
${question}

【回答指針】
- 実際のデータに基づいた具体的な分析を行ってください
- 数値や傾向を具体的に示してください
- トレンドの要因や背景も説明してください
- 記事のタイトルや著者名を具体的に言及してください
- 投稿戦略のアドバイスも含めてください
- 絵文字を使って見やすく整理してください

回答:
`

    // Gemini API呼び出し
    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    })

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text()
      console.error('Gemini API error:', errorData)
      throw new Error(`Gemini API error: ${geminiResponse.status}`)
    }

    const geminiData = await geminiResponse.json()
    
    if (!geminiData.candidates || !geminiData.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from Gemini API')
    }

    const analysisResult = geminiData.candidates[0].content.parts[0].text

    return NextResponse.json({
      analysis: analysisResult,
      metadata: {
        articlesAnalyzed: articles.length,
        category: category || 'すべて',
        period: period || 'すべて',
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error in Gemini analysis:', error)
    
    // エラー時はフォールバック分析を使用
    return generateFallbackResponse(body?.articles || [], body?.question || '', body?.category, body?.period)
  }
}

// フォールバック分析レスポンス生成
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateFallbackResponse(articles: any[], question: string, category?: string, period?: string) {
  const analysis = generateFallbackAnalysis(articles, question)
  
  return NextResponse.json({
    analysis: analysis,
    metadata: {
      articlesAnalyzed: articles.length,
      category: category || 'フォールバック',
      period: period || 'フォールバック',
      timestamp: new Date().toISOString(),
      fallback: true
    }
  })
}

// フォールバック分析関数（将来の機能拡張用）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function generateFallbackAnalysis(articles: ArticleData[], question: string): string {
  if (!articles || articles.length === 0) {
    return `申し訳ございません。現在分析できる記事データがありません。

📊 **状況**
• 分析対象: 0件の記事

💡 **提案**
• データの更新をお試しください
• フィルター設定を確認してください`
  }

  const totalLikes = articles.reduce((sum, article) => sum + (article.likeCount || 0), 0)
  const avgLikes = Math.round(totalLikes / articles.length)
  const topArticle = articles.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))[0]
  
  const categories = Array.from(new Set(articles.map(a => a.category).filter(Boolean)))
  const topAuthors = Array.from(new Set(articles.map(a => a.authorId))).slice(0, 5)

  return `🤖 **AI分析結果** (簡易版)

📊 **全体統計**
• 分析記事数: ${articles.length}件
• 平均いいね数: ${avgLikes}
• 総いいね数: ${totalLikes.toLocaleString()}

🏆 **トップ記事**
• タイトル: "${topArticle?.title}"
• 著者: ${topArticle?.authorId}
• いいね: ${topArticle?.likeCount}

📂 **カテゴリー**
${categories.map(cat => `• ${cat}`).join('\n')}

👤 **活発な著者**
${topAuthors.map(author => `• ${author}`).join('\n')}

💡 **分析結果**
現在${articles.length}件の記事を分析しました。より詳細な分析には、具体的な質問をお聞かせください。

⚠️ 注意: Gemini AI接続エラーのため簡易分析を表示中`
}

export async function GET() {
  return NextResponse.json({ 
    status: 'Gemini Analysis API is running',
    endpoints: {
      analysis: 'POST /api/gemini-analysis'
    }
  })
} 