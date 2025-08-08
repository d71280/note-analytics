import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface KnowledgeItem {
  id: string
  title: string
  content: string
  content_type: string
  tags?: string[]
  embedding?: number[]
}

interface GenerationRequest {
  prompt: string
  platform: 'x' | 'note' | 'wordpress' | 'article'
  maxLength: number
  style?: 'professional' | 'casual' | 'educational' | 'entertaining'
  tone?: 'formal' | 'friendly' | 'authoritative' | 'conversational'
  includeHashtags?: boolean
  targetAudience?: string
  contentType?: 'summary' | 'analysis' | 'tutorial' | 'opinion' | 'news'
}

export async function POST(request: NextRequest) {
  console.log('=== Advanced Content Generation API Start ===')
  
  try {
    const {
      prompt,
      platform = 'x',
      maxLength = 280,
      style = 'professional',
      tone = 'friendly',
      includeHashtags = false,
      targetAudience = '一般',
      contentType = 'summary'
    }: GenerationRequest = await request.json()

    console.log('Request params:', {
      prompt,
      platform,
      maxLength,
      style,
      tone,
      includeHashtags,
      targetAudience,
      contentType
    })

    // 知識ベースから関連コンテンツを取得
    const knowledgeItems = await fetchRelevantKnowledge(prompt, platform)
    
    // 高度なプロンプトエンジニアリング
    const enhancedPrompt = buildAdvancedPrompt({
      prompt,
      platform,
      maxLength,
      style,
      tone,
      includeHashtags,
      targetAudience,
      contentType,
      knowledgeItems
    })

    // AI生成を実行
    const generatedContent = await generateWithAI(enhancedPrompt, platform, maxLength)

    return NextResponse.json({
      success: true,
      content: generatedContent.content,
      metadata: {
        platform,
        style,
        tone,
        contentType,
        wordCount: generatedContent.content.length,
        usedKnowledgeCount: knowledgeItems.length,
        model: generatedContent.model,
        generationTime: generatedContent.generationTime
      },
      knowledgeSources: knowledgeItems.map(item => ({
        title: item.title,
        contentType: item.content_type,
        relevance: item.relevance || 'high'
      }))
    })

  } catch (error) {
    console.error('=== Advanced Generation Error ===', error)
    return NextResponse.json(
      { 
        error: '高度なコンテンツ生成中にエラーが発生しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function fetchRelevantKnowledge(prompt: string, platform: string): Promise<KnowledgeItem[]> {
  const supabase = createClient()
  
  try {
    // まず、タグベースで関連コンテンツを検索
    const promptKeywords = extractKeywords(prompt)
    
    let query = supabase
      .from('knowledge_base')
      .select('id, title, content, content_type, tags')
      .order('created_at', { ascending: false })
      .limit(20)

    // タグでフィルタリング
    if (promptKeywords.length > 0) {
      query = query.overlaps('tags', promptKeywords)
    }

    const { data, error } = await query

    if (error) {
      console.error('Knowledge fetch error:', error)
      return []
    }

    const items = (data as KnowledgeItem[]) || []
    
    // 関連性スコアを計算
    const scoredItems = items.map(item => ({
      ...item,
      relevance: calculateRelevance(item, prompt, platform)
    }))

    // 関連性でソートして上位10件を返す
    return scoredItems
      .sort((a, b) => (b.relevance || 0) - (a.relevance || 0))
      .slice(0, 10)

  } catch (error) {
    console.error('Knowledge fetch error:', error)
    return []
  }
}

function extractKeywords(text: string): string[] {
  // 日本語のキーワード抽出（簡易版）
  const keywords = text
    .replace(/[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1)
    .slice(0, 5)
  
  return [...new Set(keywords)]
}

function calculateRelevance(item: KnowledgeItem, prompt: string, platform: string): number {
  let score = 0
  
  // タイトルマッチング
  if (item.title.toLowerCase().includes(prompt.toLowerCase())) {
    score += 3
  }
  
  // コンテンツマッチング
  if (item.content.toLowerCase().includes(prompt.toLowerCase())) {
    score += 2
  }
  
  // プラットフォーム適合性
  if (item.content_type === platform) {
    score += 1
  }
  
  // タグマッチング
  const promptKeywords = extractKeywords(prompt)
  const tagMatches = item.tags?.filter(tag => 
    promptKeywords.some(keyword => tag.toLowerCase().includes(keyword.toLowerCase()))
  ).length || 0
  
  score += tagMatches * 2
  
  return score
}

function buildAdvancedPrompt(params: {
  prompt: string
  platform: string
  maxLength: number
  style: string
  tone: string
  includeHashtags: boolean
  targetAudience: string
  contentType: string
  knowledgeItems: KnowledgeItem[]
}): string {
  const {
    prompt,
    platform,
    maxLength,
    style,
    tone,
    includeHashtags,
    targetAudience,
    contentType,
    knowledgeItems
  } = params

  const knowledgeContext = knowledgeItems.length > 0
    ? knowledgeItems.map(item => 
        `【${item.title}】\n${item.content.substring(0, 300)}...`
      ).join('\n\n')
    : '参考知識がありません。一般的な知識に基づいて生成してください。'

  const platformConfig = {
    x: {
      name: 'X (Twitter)',
      requirements: [
        `${maxLength}文字以内`,
        '簡潔で印象的な内容',
        'エンゲージメントを重視',
        includeHashtags ? '適切なハッシュタグを含める' : 'ハッシュタグは含めない'
      ]
    },
    note: {
      name: 'Note',
      requirements: [
        `${maxLength}文字以内`,
        '読者に価値を提供',
        '専門性と親しみやすさのバランス',
        '記事の導入や要約として機能'
      ]
    },
    wordpress: {
      name: 'WordPress',
      requirements: [
        `${maxLength}文字以内`,
        'SEOを意識した内容',
        '読者の興味を引く',
        'ブログ記事の抜粋として機能'
      ]
    },
    article: {
      name: '記事',
      requirements: [
        `${maxLength}文字以内`,
        '構造化された内容',
        '明確な論理展開',
        '読者の理解を促進'
      ]
    }
  }

  const config = platformConfig[platform as keyof typeof platformConfig] || platformConfig.x

  const styleGuide = {
    professional: '専門的で信頼性の高い内容。データや事実に基づく。',
    casual: '親しみやすく、読みやすい内容。日常的な表現を使用。',
    educational: '学習効果を重視。段階的な説明と具体例を含む。',
    entertaining: '興味を引く内容。ユーモアや驚きの要素を含む。'
  }

  const toneGuide = {
    formal: '丁寧で改まった表現。敬語を適切に使用。',
    friendly: '親しみやすい表現。読者との距離感を縮める。',
    authoritative: '専門家としての立場。自信に満ちた表現。',
    conversational: '会話のような自然な表現。読者との対話を意識。'
  }

  return `あなたは${config.name}のコンテンツ生成専門家です。

【生成要件】
- プラットフォーム: ${config.name}
- 文字数制限: ${config.requirements.join(', ')}
- スタイル: ${styleGuide[style as keyof typeof styleGuide]}
- トーン: ${toneGuide[tone as keyof typeof toneGuide]}
- ターゲット: ${targetAudience}
- コンテンツタイプ: ${contentType}

【参考知識】
${knowledgeContext}

【生成指示】
「${prompt}」について、上記の要件に従って${maxLength}文字以内のコンテンツを生成してください。

【出力形式】
- 1つの完結した文章
- 指定された文字数以内
- 指定されたスタイルとトーンに準拠
- 参考知識を効果的に活用

生成してください：`
}

async function generateWithAI(prompt: string, platform: string, maxLength: number): Promise<{
  content: string
  model: string
  generationTime: number
}> {
  const startTime = Date.now()
  let content = ''
  let model = 'fallback'

  // 1. Grok APIを試行
  const grokApiKey = process.env.GROK_API_KEY
  if (grokApiKey) {
    try {
      const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${grokApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `あなたは${platform}のコンテンツ生成専門家です。必ず${maxLength}文字以内で、指定された要件に従ってコンテンツを生成してください。`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          model: 'grok-2-latest',
          stream: false,
          temperature: 0.7,
          max_tokens: Math.min(maxLength * 2, 1000)
        })
      })

      if (grokResponse.ok) {
        const grokData = await grokResponse.json()
        if (grokData.choices?.[0]?.message?.content) {
          content = grokData.choices[0].message.content
          model = 'grok-2-latest'
        }
      }
    } catch (error) {
      console.warn('Grok API error:', error)
    }
  }

  // 2. Gemini APIを試行
  if (!content) {
    const geminiApiKey = process.env.GEMINI_API_KEY
    if (geminiApiKey) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const genAI = new GoogleGenerativeAI(geminiApiKey)
        const genModel = genAI.getGenerativeModel({ model: 'gemini-pro' })

        const result = await genModel.generateContent(prompt)
        const response = await result.response
        content = response.text() || ''
        model = 'gemini-pro'
      } catch (error) {
        console.warn('Gemini API error:', error)
      }
    }
  }

  // 3. フォールバック生成
  if (!content) {
    content = generateFallbackContent(platform, maxLength)
    model = 'fallback'
  }

  // 文字数制限の最終チェック
  if (content.length > maxLength) {
    content = content.substring(0, maxLength - 3) + '...'
  }

  const generationTime = Date.now() - startTime

  return {
    content,
    model,
    generationTime
  }
}

function generateFallbackContent(platform: string, maxLength: number): string {
  const fallbackTemplates = {
    x: [
      '今日学んだこと：新しい知識を得ることで視野が広がります。継続的な学習が成長の鍵です。',
      '興味深い発見がありました。知識を共有することで、みんなで成長できますね。',
      '学びの時間は貴重です。新しい視点を得ることで、世界が変わって見えます。'
    ],
    note: [
      '継続的な学習と成長を通じて、価値のあるコンテンツをお届けしています。',
      '新しい発見や学びを共有することで、読者の皆様と一緒に成長していきたいと思います。',
      '知識の共有は、社会全体の成長につながります。'
    ],
    wordpress: [
      '読者の皆様に価値のある情報をお届けすることを心がけています。',
      '専門的な知識と実践的な経験を組み合わせた内容をお届けします。',
      '継続的な改善と学習を通じて、より良いコンテンツを提供していきます。'
    ],
    article: [
      '詳細な分析と実践的なアドバイスを通じて、読者の理解を深めることを目指しています。',
      '専門的な視点から、読者の皆様に役立つ情報をお届けします。',
      '継続的な研究と実践を通じて、信頼性の高いコンテンツを提供しています。'
    ]
  }

  const templates = fallbackTemplates[platform as keyof typeof fallbackTemplates] || fallbackTemplates.x
  const template = templates[Math.floor(Math.random() * templates.length)]
  
  return template.substring(0, maxLength)
} 