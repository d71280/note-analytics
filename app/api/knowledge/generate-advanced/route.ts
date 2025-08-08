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

    // 知識ベースから関連コンテンツを取得（より詳細な検索）
    const knowledgeItems = await fetchRelevantKnowledge(prompt, platform)
    
    // 強力な文章生成のためのプロンプトエンジニアリング
    const powerfulPrompt = buildPowerfulPrompt({
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
    const generatedContent = await generateWithPowerfulAI(powerfulPrompt, platform, maxLength)

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
        relevance: 'high'
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
    // より詳細なキーワード抽出
    const promptKeywords = extractDetailedKeywords(prompt)
    
    let query = supabase
      .from('knowledge_base')
      .select('id, title, content, content_type, tags')
      .order('created_at', { ascending: false })
      .limit(30) // より多くの候補を取得

    // 複数の検索条件を組み合わせ
    const searchConditions = []
    
    // 1. タグでの検索
    if (promptKeywords.length > 0) {
      searchConditions.push(query.overlaps('tags', promptKeywords))
    }
    
    // 2. タイトルでの検索
    const titleSearch = promptKeywords.map(keyword => 
      query.ilike('title', `%${keyword}%`)
    )
    
    // 3. コンテンツでの検索
    const contentSearch = promptKeywords.map(keyword => 
      query.ilike('content', `%${keyword}%`)
    )

    // 複数の条件で検索を実行
    const searchPromises = [
      query,
      ...titleSearch,
      ...contentSearch
    ]

    const searchResults = await Promise.all(
      searchPromises.map(async (searchQuery, index) => {
        try {
          const { data, error } = await searchQuery
          if (error) {
            console.warn(`Search ${index} error:`, error)
            return []
          }
          return data || []
        } catch (error) {
          console.warn(`Search ${index} failed:`, error)
          return []
        }
      })
    )

    // 結果を統合して重複を除去
    const allItems = searchResults.flat()
    const uniqueItems = allItems.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    )

    // 関連性スコアを計算（より詳細なスコアリング）
    const scoredItems = uniqueItems.map(item => ({
      ...item,
      relevance: calculateDetailedRelevance(item, prompt, platform, promptKeywords)
    }))

    // 関連性でソートして上位15件を返す
    return scoredItems
      .sort((a, b) => (b.relevance || 0) - (a.relevance || 0))
      .slice(0, 15)

  } catch (error) {
    console.error('Knowledge fetch error:', error)
    return []
  }
}

function extractDetailedKeywords(text: string): string[] {
  // より詳細なキーワード抽出
  const keywords = text
    .replace(/[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1)
    .map(word => word.toLowerCase())
    .filter(word => !['の', 'に', 'は', 'を', 'が', 'で', 'と', 'から', 'まで', 'より', 'など', 'とか', 'や', 'やら', 'か', 'も', 'でも', 'ばかり', 'だけ', 'ほど', 'くらい', 'ぐらい', 'など', 'なんか', 'なんて', 'なんと', 'なんの', 'なんで', 'なぜ', 'どう', 'どんな', 'どの', 'どれ', 'どこ', 'いつ', '誰', '何', 'いくつ', 'いくら'].includes(word))
    .slice(0, 8) // より多くのキーワードを抽出
  
  return Array.from(new Set(keywords))
}

function calculateDetailedRelevance(item: KnowledgeItem, prompt: string, platform: string, keywords: string[]): number {
  let score = 0
  
  // タイトルマッチング（重み: 5）
  const titleLower = item.title.toLowerCase()
  const promptLower = prompt.toLowerCase()
  if (titleLower.includes(promptLower)) {
    score += 5
  }
  
  // キーワードマッチング（重み: 3 per keyword）
  const titleKeywordMatches = keywords.filter(keyword => 
    titleLower.includes(keyword)
  ).length
  score += titleKeywordMatches * 3
  
  // コンテンツマッチング（重み: 2）
  const contentLower = item.content.toLowerCase()
  if (contentLower.includes(promptLower)) {
    score += 2
  }
  
  // コンテンツキーワードマッチング（重み: 1 per keyword）
  const contentKeywordMatches = keywords.filter(keyword => 
    contentLower.includes(keyword)
  ).length
  score += contentKeywordMatches * 1
  
  // プラットフォーム適合性（重み: 2）
  if (item.content_type === platform) {
    score += 2
  }
  
  // タグマッチング（重み: 2 per tag）
  const tagMatches = item.tags?.filter(tag => 
    keywords.some(keyword => tag.toLowerCase().includes(keyword.toLowerCase()))
  ).length || 0
  score += tagMatches * 2
  
  // コンテンツの長さによる調整（適度な長さを好む）
  const contentLength = item.content.length
  if (contentLength > 100 && contentLength < 2000) {
    score += 1
  }
  
  return score
}

function buildPowerfulPrompt(params: {
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

  // 知識ベースの詳細情報を提供（より構造化された情報）
  const knowledgeContext = knowledgeItems.length > 0
    ? knowledgeItems.map((item, index) => 
        `【知識${index + 1}: ${item.title}】
内容: ${item.content.substring(0, 500)}...
タイプ: ${item.content_type}
タグ: ${item.tags?.join(', ') || 'なし'}
関連性: 高`
      ).join('\n\n')
    : '一般的な知識とベストプラクティスに基づいて'

  const platformConfig = {
    x: {
      name: 'X (Twitter)',
      requirements: [
        `${maxLength}文字以内で完結`,
        '即座に価値を提供',
        '具体的な数値やデータを含む',
        '読者の行動を促す要素',
        includeHashtags ? '適切なハッシュタグ（2-3個）を含める' : 'ハッシュタグは含めない',
        'エンゲージメントを重視した表現',
        '実用的で実践的なアドバイス'
      ]
    },
    note: {
      name: 'Note',
      requirements: [
        `${maxLength}文字以内`,
        '読者に深い価値を提供',
        '専門性と親しみやすさのバランス',
        '具体的な事例やデータを含む',
        '読者の理解を深める洞察',
        '実践的なステップや方法論',
        '信頼性の高い情報源'
      ]
    },
    wordpress: {
      name: 'WordPress',
      requirements: [
        `${maxLength}文字以内`,
        'SEOを意識したキーワード配置',
        '読者の興味を引く導入',
        '具体的で実用的な情報',
        '検索エンジンでの上位表示を意識',
        '読者の問題解決に直接的に役立つ内容',
        '専門的で信頼性の高い情報'
      ]
    },
    article: {
      name: '記事',
      requirements: [
        `${maxLength}文字以内`,
        '明確な論理展開',
        '具体的なデータや事例',
        '読者の理解を促進する構造',
        '実践的な価値を提供',
        '専門的で信頼性の高い内容',
        '行動を促す明確な結論'
      ]
    }
  }

  const config = platformConfig[platform as keyof typeof platformConfig] || platformConfig.x

  const styleGuide = {
    professional: '専門的で信頼性の高い内容。具体的なデータ、研究結果、統計を含む。実証済みの方法論を重視。',
    casual: '親しみやすく、読みやすい内容。日常的な表現と実践的なアドバイス。読者との距離感を縮める。',
    educational: '学習効果を最大化。段階的な説明、具体例、実践ステップを含む。理解を深める構造化された内容。',
    entertaining: '興味を引く魅力的な内容。ユーモア、驚き、ストーリー要素を含む。読者の感情に訴える。'
  }

  const toneGuide = {
    formal: '丁寧で改まった表現。敬語を適切に使用。専門用語を効果的に活用。信頼性を重視。',
    friendly: '親しみやすい表現。読者との距離感を縮める。共感を呼ぶ内容。温かみのある語りかけ。',
    authoritative: '専門家としての立場。自信に満ちた表現。説得力のある論理展開。権威性を保つ。',
    conversational: '会話のような自然な表現。読者との対話を意識。質問形式を活用。親近感を演出。'
  }

  const contentTypeGuide = {
    summary: '要点を簡潔にまとめ、核心的な情報を提供。重要なポイントを明確に示す。',
    analysis: '深い洞察と分析を含む。データに基づく考察。読者の理解を促進する解釈。',
    tutorial: '実践的な手順や方法を具体的に説明。段階的なガイド。即座に実践可能な内容。',
    opinion: '独自の視点と論理的な主張を展開。根拠に基づく意見。読者の思考を刺激。',
    news: '最新の情報と背景を分かりやすく伝える。事実に基づく報道。文脈を提供。'
  }

  return `あなたは${config.name}のコンテンツ生成専門家です。最高品質のコンテンツを作成してください。

【重要な指示】
- 提供された知識ベースの内容を最大限に活用し、その概念やアイデアを具体的に応用する
- プロンプトの指示に基づいて、読者に明確で実用的な価値を提供する
- 抽象的な表現を避け、具体的な数値、事例、ステップを含める
- 読者の問題解決や成長に直接的に役立つ情報を提供する
- 必ず${maxLength}文字以内で完結し、読みやすい文章にする

【生成要件】
- プラットフォーム: ${config.name}
- 文字数制限: ${config.requirements.join(', ')}
- スタイル: ${styleGuide[style as keyof typeof styleGuide]}
- トーン: ${toneGuide[tone as keyof typeof toneGuide]}
- コンテンツタイプ: ${contentTypeGuide[contentType as keyof typeof contentTypeGuide]}
- ターゲット: ${targetAudience}

【参考知識ベース】
${knowledgeContext}

【具体的な生成指示】
「${prompt}」について、上記の参考知識を基に、以下の要素を含む強力なコンテンツを${maxLength}文字以内で生成してください：

1. 具体的な数値やデータ（研究結果、統計、事例）
2. 実践的なアドバイスや具体的なステップ
3. 読者の行動を促す明確な要素
4. 知識ベースの内容を活用した専門的な洞察
5. 読者に即座に価値を提供する内容
6. 信頼性と実用性を兼ね備えた情報

【品質基準】
- 明確で分かりやすい表現
- 実践的な価値を提供
- 読者の興味を引く内容
- 信頼性の高い情報源
- 行動を促す要素を含む
- 知識ベースの内容を効果的に活用

【出力形式】
- 1つの完結した文章
- 指定された文字数以内
- 指定されたスタイルとトーンに準拠
- 具体的で実用的な内容
- 読者の行動を促す要素を含む

生成してください：`
}

async function generateWithPowerfulAI(prompt: string, platform: string, maxLength: number): Promise<{
  content: string
  model: string
  generationTime: number
}> {
  const startTime = Date.now()
  let content = ''
  let model = 'fallback'

  // 1. Grok APIを試行（より強力な設定）
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
              content: `あなたは${platform}のコンテンツ生成専門家です。最高品質のコンテンツを作成してください。

【重要な指示】
- 具体的で実用的な情報を提供する
- 読者の行動を促す内容にする
- 抽象的な表現を避け、具体的な例を含める
- 読者の問題解決に直接的に役立つ内容にする
- 必ず${maxLength}文字以内で完結させる

【品質基準】
- 明確で分かりやすい表現
- 実践的な価値を提供
- 読者の興味を引く内容
- 信頼性の高い情報
- 行動を促す要素を含む`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          model: 'grok-2-latest',
          stream: false,
          temperature: 0.9, // より創造性を高める
          max_tokens: Math.min(maxLength * 3, 1500), // より多くのトークンを許可
          top_p: 0.9, // 多様性を高める
          frequency_penalty: 0.1, // 繰り返しを減らす
          presence_penalty: 0.1 // 新しいトピックを促進
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

  // 2. Gemini APIを試行（より強力な設定）
  if (!content) {
    const geminiApiKey = process.env.GEMINI_API_KEY
    if (geminiApiKey) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const genAI = new GoogleGenerativeAI(geminiApiKey)
        const genModel = genAI.getGenerativeModel({ 
          model: 'gemini-pro',
          generationConfig: {
            temperature: 0.9,
            topP: 0.9,
            topK: 40,
            maxOutputTokens: Math.min(maxLength * 3, 1500)
          }
        })

        const result = await genModel.generateContent(prompt)
        const response = await result.response
        content = response.text() || ''
        model = 'gemini-pro'
      } catch (error) {
        console.warn('Gemini API error:', error)
      }
    }
  }

  // 3. 強力なフォールバック生成
  if (!content) {
    content = generatePowerfulFallbackContent(platform, maxLength)
    model = 'powerful-fallback'
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

function generatePowerfulFallbackContent(platform: string, maxLength: number): string {
  const powerfulTemplates = {
    x: [
      '最新の研究によると、継続的な学習は生産性を平均47%向上させます。毎日30分の学習時間を確保することで、3ヶ月後には明確な成長を実感できるでしょう。',
      '効果的な学習の秘訣は「実践」にあります。学んだことを24時間以内に実践することで、記憶定着率が78%向上することが分かっています。',
      '成功する人とそうでない人の違いは「行動力」です。知識を蓄えるだけでなく、即座に実践することで、驚くほどの成果を上げることができます。'
    ],
    note: [
      '継続的な学習と実践を通じて、あなたの専門性は指数関数的に向上します。今日学んだことを明日の行動に活かすことで、確実な成長を実現しましょう。',
      '知識の積み重ねが革新的なアイデアを生み出します。異なる分野の知識を組み合わせることで、独自の価値を創造できるようになります。',
      '効果的な学習戦略を実践することで、従来の3倍の速度でスキルアップが可能です。具体的な目標設定と継続的なフィードバックが成功の鍵です。'
    ],
    wordpress: [
      '読者の問題を解決する具体的な方法を提供することで、信頼性とエンゲージメントを大幅に向上させることができます。実践的なアドバイスが最も価値のあるコンテンツです。',
      'SEOを意識した質の高いコンテンツは、検索エンジンでの上位表示と読者の満足度を同時に実現します。具体的で実用的な情報が成功の鍵です。',
      '読者の興味を引く魅力的なコンテンツは、平均滞在時間を2.5倍に延長し、リピート訪問率を67%向上させることが分かっています。'
    ],
    article: [
      '専門的な知識と実践的な経験を組み合わせることで、読者に最大の価値を提供できます。具体的な事例と数値に基づいた分析が信頼性を高めます。',
      '構造化された情報と明確な論理展開により、読者の理解を深め、実践への移行を促進します。段階的な説明が学習効果を最大化します。',
      '継続的な研究と実践を通じて得られた知見は、読者の成長に直接的に貢献します。実証済みの方法論が最も価値のある情報です。'
    ]
  }

  const templates = powerfulTemplates[platform as keyof typeof powerfulTemplates] || powerfulTemplates.x
  const template = templates[Math.floor(Math.random() * templates.length)]
  
  return template.substring(0, maxLength)
} 