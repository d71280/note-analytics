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

    // 戻り値の検証とデバッグ
    console.log('Generated content result:', generatedContent)
    
    if (!generatedContent) {
      throw new Error('AI生成でコンテンツが生成されませんでした')
    }

    if (!generatedContent.content) {
      throw new Error('AI生成でコンテンツが空でした')
    }

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
        model: generatedContent.model || 'unknown',
        generationTime: generatedContent.generationTime || 0
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
    
    // 複数の検索戦略を実行
    const searchStrategies = []
    
    // 戦略1: キーワードベース検索
    if (promptKeywords.length > 0) {
      const keywordQuery = supabase
        .from('knowledge_base')
        .select('id, title, content, content_type, tags')
        .or(`tags.cs.{${promptKeywords.join(',')}},title.ilike.%${promptKeywords[0]}%,content.ilike.%${promptKeywords[0]}%`)
        .limit(10)
      searchStrategies.push(keywordQuery)
    }
    
    // 戦略2: プラットフォーム特化検索
    const platformQuery = supabase
      .from('knowledge_base')
      .select('id, title, content, content_type, tags')
      .eq('content_type', platform)
      .limit(8)
    searchStrategies.push(platformQuery)
    
    // 戦略3: 多様性確保のためのランダム検索
    const randomQuery = supabase
      .from('knowledge_base')
      .select('id, title, content, content_type, tags')
      .order('created_at', { ascending: false })
      .limit(12)
    searchStrategies.push(randomQuery)
    
    // 戦略4: 異なるコンテンツタイプの検索
    const diverseTypes = ['strategy', 'guidebook', 'analysis', 'research', 'tutorial']
    const diverseQuery = supabase
      .from('knowledge_base')
      .select('id, title, content, content_type, tags')
      .in('content_type', diverseTypes)
      .limit(10)
    searchStrategies.push(diverseQuery)

    // 複数の戦略で検索を実行
    const searchResults = await Promise.all(
      searchStrategies.map(async (searchQuery, index) => {
        try {
          const { data, error } = await searchQuery
          if (error) {
            console.warn(`Search strategy ${index} error:`, error)
            return []
          }
          return data || []
        } catch (error) {
          console.warn(`Search strategy ${index} failed:`, error)
          return []
        }
      })
    )

    // 結果を統合して重複を除去
    const allItems = searchResults.flat()
    const uniqueItems = allItems.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    )

    // 多様性を確保するための選択ロジック
    const diverseItems = selectDiverseItems(uniqueItems, prompt, platform, promptKeywords)

    return diverseItems

  } catch (error) {
    console.error('Knowledge fetch error:', error)
    return []
  }
}

function selectDiverseItems(items: KnowledgeItem[], prompt: string, platform: string, keywords: string[]): KnowledgeItem[] {
  // 関連性スコアを計算
  const scoredItems = items.map(item => ({
    ...item,
    relevance: calculateDetailedRelevance(item, prompt, platform, keywords)
  }))

  // スコアでソート
  const sortedItems = scoredItems.sort((a, b) => (b.relevance || 0) - (a.relevance || 0))
  
  // 多様性を確保するための選択（重み付けを強化）
  const selectedItems = []
  const usedTypes = new Set<string>()
  const usedTags = new Set<string>()
  const usedKeywords = new Set<string>()
  
  // 上位の関連アイテムを優先的に選択
  for (const item of sortedItems.slice(0, 25)) {
    if (selectedItems.length >= 15) break
    
    // コンテンツタイプの多様性を確保
    const typeCount = Array.from(usedTypes).filter(type => 
      item.content_type === type
    ).length
    
    // タグの多様性を確保
    const tagOverlap = item.tags?.filter(tag => 
      usedTags.has(tag)
    ).length || 0
    
    // キーワードの多様性を確保
    const keywordOverlap = keywords.filter(keyword => 
      item.title.toLowerCase().includes(keyword) || 
      item.content.toLowerCase().includes(keyword)
    ).length
    
    // 多様性スコアを計算（重み付けを強化）
    const diversityScore = (1 / (typeCount + 1)) + (1 / (tagOverlap + 1)) + (1 / (keywordOverlap + 1))
    const finalScore = (item.relevance || 0) * 0.4 + diversityScore * 0.6 // 多様性の重みを60%に増加
    
    // スコアが高いアイテムを選択
    if (finalScore > 1.5 || selectedItems.length < 8) {
      selectedItems.push({
        ...item,
        relevance: finalScore
      })
      usedTypes.add(item.content_type)
      item.tags?.forEach(tag => usedTags.add(tag))
      keywords.forEach(keyword => usedKeywords.add(keyword))
    }
  }
  
  // 最終的な多様性チェック（より厳格に）
  const finalItems = []
  const typeDistribution = new Map<string, number>()
  const tagDistribution = new Map<string, number>()
  
  for (const item of selectedItems) {
    const currentTypeCount = typeDistribution.get(item.content_type) || 0
    const currentTagCount = item.tags?.reduce((sum, tag) => 
      sum + (tagDistribution.get(tag) || 0), 0) || 0
    
    // 各タイプから最大2件まで選択（より分散）
    if (currentTypeCount < 2 && currentTagCount < 3) {
      finalItems.push(item)
      typeDistribution.set(item.content_type, currentTypeCount + 1)
      item.tags?.forEach(tag => {
        tagDistribution.set(tag, (tagDistribution.get(tag) || 0) + 1)
      })
    }
    
    if (finalItems.length >= 12) break
  }
  
  return finalItems.sort((a, b) => (b.relevance || 0) - (a.relevance || 0))
}

function extractDetailedKeywords(text: string): string[] {
  // より詳細なキーワード抽出
  const keywords = text
    .replace(/[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1)
    .map(word => word.toLowerCase())
    .filter(word => !['の', 'に', 'は', 'を', 'が', 'で', 'と', 'から', 'まで', 'より', 'など', 'とか', 'や', 'やら', 'か', 'も', 'でも', 'ばかり', 'だけ', 'ほど', 'くらい', 'ぐらい', 'など', 'なんか', 'なんて', 'なんと', 'なんの', 'なんで', 'なんで', 'なぜ', 'どう', 'どんな', 'どの', 'どれ', 'どこ', 'いつ', '誰', '何', 'いくつ', 'いくら'].includes(word))
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

  return `あなたは${config.name}のコンテンツ生成専門家です。最高品質で多様性のあるコンテンツを作成してください。

【重要な指示】
- 提供された知識ベースの内容を活用し、その概念やアイデアを創造的に応用する
- 毎回異なる視点、表現、具体例を使用して多様性を確保する
- 抽象的な表現を避け、具体的な数値、事例、ステップを含める
- 読者の問題解決や成長に直接的に役立つ情報を提供する
- 必ず${maxLength}文字以内で完結し、読みやすい文章にする

【創造性と多様性の基準】
- 異なるアプローチや視点を提供
- 多様な具体例や事例を使用（同じ事例を繰り返し使用しない）
- 様々な表現方法を活用
- 読者の興味を引く魅力的な内容
- 深い洞察と実践的な価値を提供

【品質向上のための指示】
- 統計データや研究結果を活用して信頼性を高める
- 段階的な説明やステップバイステップのガイドを提供
- 読者の感情に訴えるストーリーテリングを活用
- 反対意見や異なる視点も考慮したバランスの取れた内容
- 即座に実践できる具体的なアクションを提示

【多様性確保のルール】
- 同じキーワードやフレーズを繰り返し使用しない
- 異なる業界や分野の事例を組み合わせる
- 様々なトーンやスタイルを試す
- 読者の異なるニーズや状況に対応する
- 予想外の角度からアプローチする

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
「${prompt}」について、上記の参考知識を基に、以下の要素を含む強力で多様なコンテンツを${maxLength}文字以内で生成してください：

1. 具体的な数値やデータ（研究結果、統計、事例）
2. 実践的なアドバイスや具体的なステップ
3. 読者の行動を促す明確な要素
4. 知識ベースの内容を活用した専門的な洞察
5. 読者に即座に価値を提供する内容
6. 信頼性と実用性を兼ね備えた情報
7. 予想外の視点やアプローチ
8. 感情に訴える魅力的な表現

【品質基準】
- 明確で分かりやすい表現
- 実践的な価値を提供
- 読者の興味を引く内容
- 信頼性の高い情報源
- 行動を促す要素を含む
- 知識ベースの内容を効果的に活用
- 多様性と創造性を重視
- 深い洞察と実用的な価値

【出力形式】
- 1つの完結した文章
- 指定された文字数以内
- 指定されたスタイルとトーンに準拠
- 具体的で実用的な内容
- 読者の行動を促す要素を含む
- 多様で魅力的な表現

生成してください：`
}

async function generateWithPowerfulAI(prompt: string, platform: string, maxLength: number): Promise<{ content: string; model: string; generationTime: number }> {
  console.log('=== generateWithPowerfulAI Start ===')
  const startTime = Date.now()
  let content = ''
  let model = 'fallback'

  // 1. OpenAI GPT-4oを試行（最高品質・最新モデル）
  console.log('Checking OpenAI API key...')
  const openaiApiKey = process.env.OPEN_AI_KEY
  console.log('OpenAI API key exists:', !!openaiApiKey)
  if (openaiApiKey) {
    try {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: prompt // buildPowerfulPromptで作成された知識ベースを含む完全なプロンプトを使用
            }
          ],
          model: 'gpt-4o',
          stream: false,
          temperature: 0.9, // 高い創造性
          max_tokens: Math.min(maxLength * 3, 1500),
          top_p: 0.95, // 多様な選択
          frequency_penalty: 0.3, // 繰り返しを減らす
          presence_penalty: 0.2, // 新しいトピックを促進
          stop: ['\n\n', '---', '###', '##'] // 自然な終了（最大4個まで）
        })
      })

      console.log('OpenAI response status:', openaiResponse.status)
      if (openaiResponse.ok) {
        const openaiData = await openaiResponse.json()
        console.log('OpenAI response data:', openaiData)
        if (openaiData.choices?.[0]?.message?.content) {
          content = openaiData.choices[0].message.content
          model = 'gpt-4o'
          console.log('GPT-4o content generated:', content.substring(0, 50) + '...')
        }
      } else {
        const errorData = await openaiResponse.json()
        console.log('OpenAI API error:', errorData)
      }
    } catch (error) {
      console.warn('OpenAI GPT-4o API error:', error)
    }
  }

  // 2. OpenAI GPT-4o-miniを試行（高速・コスト効率）
  if (!content && openaiApiKey) {
    try {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: prompt // buildPowerfulPromptで作成された知識ベースを含む完全なプロンプトを使用
            }
          ],
          model: 'gpt-4o-mini',
          stream: false,
          temperature: 0.8,
          max_tokens: Math.min(maxLength * 3, 1500),
          top_p: 0.9,
          frequency_penalty: 0.2,
          presence_penalty: 0.1
        })
      })

      if (openaiResponse.ok) {
        const openaiData = await openaiResponse.json()
        if (openaiData.choices?.[0]?.message?.content) {
          content = openaiData.choices[0].message.content
          model = 'gpt-4o-mini'
        }
      }
    } catch (error) {
      console.warn('OpenAI GPT-4o-mini API error:', error)
    }
  }

  // 3. Grok APIを試行（バックアップ）
  if (!content) {
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
                content: prompt // buildPowerfulPromptで作成された知識ベースを含む完全なプロンプトを使用
              }
            ],
          model: 'grok-2-latest',
          stream: false,
          temperature: 0.98,
          max_tokens: Math.min(maxLength * 3, 1500),
          top_p: 0.98,
          frequency_penalty: 0.5,
          presence_penalty: 0.4,
          stop: ['\n\n', '---', '###', '##', '#']
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
  }

  // 4. Gemini APIを試行（バックアップ）
  if (!content) {
    const geminiApiKey = process.env.GEMINI_API_KEY
    if (geminiApiKey) {
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const genAI = new GoogleGenerativeAI(geminiApiKey)
        const genModel = genAI.getGenerativeModel({ 
          model: 'gemini-pro',
          generationConfig: {
            temperature: 0.98,
            topP: 0.98,
            topK: 60,
            maxOutputTokens: Math.min(maxLength * 3, 1500),
            candidateCount: 1
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

  // 5. 多様性のあるフォールバック生成（確実に実行）
  console.log('Before fallback check - content:', content)
  if (!content || content.trim() === '') {
    console.log('Using fallback content')
    content = generateDiverseFallbackContent(platform, maxLength)
    model = 'diverse-fallback'
  }

  // 文字数制限の最終チェック
  if (content && content.length > maxLength) {
    content = content.substring(0, maxLength - 3) + '...'
  }

  const generationTime = Date.now() - startTime

  // 確実に戻り値を返す
  const result = {
    content: content || generateDiverseFallbackContent(platform, maxLength),
    model: model || 'fallback',
    generationTime
  }
  
  console.log('=== generateWithPowerfulAI Result ===', result)
  console.log('Result content length:', result.content.length)
  return result
}

function generateDiverseFallbackContent(platform: string, maxLength: number): string {
  const diverseTemplates = {
    x: [
      '最新の研究によると、継続的な学習は生産性を平均47%向上させます。毎日30分の学習時間を確保することで、3ヶ月後には明確な成長を実感できるでしょう。',
      '効果的な学習の秘訣は「実践」にあります。学んだことを24時間以内に実践することで、記憶定着率が78%向上することが分かっています。',
      '成功する人とそうでない人の違いは「行動力」です。知識を蓄えるだけでなく、即座に実践することで、驚くほどの成果を上げることができます。',
      'リモートワーク時代の生産性向上術：1) 朝のルーティン確立 2) 集中時間の設定 3) 定期的な休憩。この3つで作業効率が2倍に向上します。',
      '個人ブランディングの成功法則：専門性×一貫性×継続性。週3回の価値ある発信で、6ヶ月後には確実に認知度が向上します。',
      'データ分析の基本は「仮説→検証→改善」のサイクル。顧客データを活用した意思決定で、売上を平均35%向上させた事例があります。',
      'クリエイティブ思考を高める3つの方法：1) 異分野の知識組み合わせ 2) 制約を創造性の源泉に 3) 失敗を恐れない実験精神。',
      '健康経営の重要性：週3回の運動で認知機能が20%向上、ストレスレベルが40%減少。長期的なキャリア成功の鍵です。'
    ],
    note: [
      '継続的な学習と実践を通じて、あなたの専門性は指数関数的に向上します。今日学んだことを明日の行動に活かすことで、確実な成長を実現しましょう。',
      '知識の積み重ねが革新的なアイデアを生み出します。異なる分野の知識を組み合わせることで、独自の価値を創造できるようになります。',
      '効果的な学習戦略を実践することで、従来の3倍の速度でスキルアップが可能です。具体的な目標設定と継続的なフィードバックが成功の鍵です。',
      'リモートワーク環境でのチームマネジメント成功の秘訣：定期的な1on1、明確な目標設定、非同期コミュニケーションの活用で生産性が向上します。',
      '個人ブランディング戦略：専門分野での価値提供、一貫したメッセージ発信、ネットワーキングの活用でキャリア機会を創出できます。',
      'データ駆動型の意思決定：顧客行動分析、A/Bテスト、予測モデルを活用することで、ビジネス成果を最大化できます。',
      'イノベーション創出のフレームワーク：デザイン思考、ブレインストーミング、プロトタイピングを組み合わせて革新的なソリューションを開発しましょう。',
      '持続可能なキャリア構築：健康管理、スキル開発、ネットワーク構築のバランスを取ることで、長期的な成功を実現できます。'
    ],
    wordpress: [
      '読者の問題を解決する具体的な方法を提供することで、信頼性とエンゲージメントを大幅に向上させることができます。実践的なアドバイスが最も価値のあるコンテンツです。',
      'SEOを意識した質の高いコンテンツは、検索エンジンでの上位表示と読者の満足度を同時に実現します。具体的で実用的な情報が成功の鍵です。',
      '読者の興味を引く魅力的なコンテンツは、平均滞在時間を2.5倍に延長し、リピート訪問率を67%向上させることが分かっています。',
      'リモートワーク時代の生産性向上：時間管理、コミュニケーション、モチベーション維持の3つの要素が重要です。',
      '個人ブランディングの実践法：専門性の構築、価値提供、ネットワーキングでキャリアを加速させましょう。',
      'データ分析の基礎知識：統計的思考、仮説検定、可視化技術を身につけてビジネス洞察力を向上させます。',
      'クリエイティブ思考の開発：発散思考と収束思考を組み合わせて革新的なアイデアを生み出しましょう。',
      '健康経営の実践：身体的・精神的健康を維持することで、長期的なキャリア成功を実現できます。'
    ],
    article: [
      '専門的な知識と実践的な経験を組み合わせることで、読者に最大の価値を提供できます。具体的な事例と数値に基づいた分析が信頼性を高めます。',
      '構造化された情報と明確な論理展開により、読者の理解を深め、実践への移行を促進します。段階的な説明が学習効果を最大化します。',
      '継続的な研究と実践を通じて得られた知見は、読者の成長に直接的に貢献します。実証済みの方法論が最も価値のある情報です。',
      'リモートワーク環境での効果的なマネジメント：コミュニケーション戦略、生産性管理、チームビルディングの実践法を解説します。',
      '個人ブランディング戦略の構築：専門性の確立、価値提供、ネットワーク構築によるキャリア加速の方法論です。',
      'データ駆動型ビジネス分析：統計的手法、予測モデル、可視化技術を活用した意思決定支援の実践ガイドです。',
      'イノベーション創出プロセス：デザイン思考、創造的問題解決、プロトタイピングを組み合わせた革新的ソリューション開発法です。',
      '持続可能なキャリア開発：健康管理、スキル開発、ワークライフバランスを統合した長期的成功戦略です。'
    ]
  }

  const templates = diverseTemplates[platform as keyof typeof diverseTemplates] || diverseTemplates.x
  const template = templates[Math.floor(Math.random() * templates.length)]
  
  return template.substring(0, maxLength)
}
