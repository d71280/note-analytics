import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent'

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

    // APIキーを環境変数から取得
    const GEMINI_API_KEY = process.env.Gemini_API_Key || process.env.GEMINI_API_KEY
    
    console.log('🔑 API Key status:', GEMINI_API_KEY ? `Found (${GEMINI_API_KEY.substring(0, 10)}...)` : 'Not found')
    
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

    // Gemini API呼び出し（強化版エラーハンドリング）
    try {
      console.log('🚀 Calling Gemini API...')
      const geminiResponse = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY
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

      console.log(`📡 Gemini API response status: ${geminiResponse.status}`)

      if (!geminiResponse.ok) {
        const errorData = await geminiResponse.text()
        console.error('❌ Gemini API error response:', {
          status: geminiResponse.status,
          statusText: geminiResponse.statusText,
          error: errorData
        })
        console.warn('🔄 Falling back to enhanced analysis')
        return generateFallbackResponse(articles, question, category, period)
      }

      const geminiData = await geminiResponse.json()
      console.log('📄 Gemini API response keys:', Object.keys(geminiData))
      
      if (!geminiData.candidates || !geminiData.candidates[0]?.content?.parts?.[0]?.text) {
        console.error('❌ Invalid Gemini API response structure:', geminiData)
        console.warn('🔄 Falling back to enhanced analysis')
        return generateFallbackResponse(articles, question, category, period)
      }

      const analysisResult = geminiData.candidates[0].content.parts[0].text
      console.log('✅ Gemini analysis successful, length:', analysisResult.length)
      
      return NextResponse.json({
        analysis: analysisResult,
        metadata: {
          articlesAnalyzed: articles.length,
          category: category || 'すべて',
          period: period || 'すべて',
          timestamp: new Date().toISOString(),
          fallback: false
        }
      })
      
    } catch (fetchError) {
      console.error('❌ Gemini API fetch error:', fetchError)
      console.warn('🔄 Falling back to enhanced analysis')
      return generateFallbackResponse(articles, question, category, period)
    }

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

// HTMLタグを除去してクリーンなテキストを取得
function cleanText(text: string): string {
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
    // 連続する特殊文字や記号を整理
    .replace(/[<>{}[\]]/g, '')
    .replace(/[|｜]/g, ' ')
    // 余分な空白・改行を除去
    .replace(/\s+/g, ' ')
    .trim()
}

// フォールバック分析関数（HTMLクリーニング対応版）
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
  
  // タイトルをクリーンアップ
  const cleanTopTitle = topArticle ? cleanText(topArticle.title) : ''
  const cleanTopAuthor = topArticle ? cleanText(topArticle.authorId) : ''
  
  const categories = Array.from(new Set(articles.map(a => a.category).filter(Boolean)))
  const topAuthors = Array.from(new Set(articles.map(a => cleanText(a.authorId || '')))).slice(0, 5)

  return `🤖 **AI分析結果** (簡易版)

📊 **全体統計**
• 分析記事数: ${articles.length}件
• 平均いいね数: ${avgLikes}
• 総いいね数: ${totalLikes.toLocaleString()}

🏆 **トップ記事**
• タイトル: "${cleanTopTitle}"
• 著者: ${cleanTopAuthor}
• いいね: ${topArticle?.likeCount}

📂 **カテゴリー**
${categories.map(cat => `• ${cleanText(cat || '')}`).join('\n')}

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