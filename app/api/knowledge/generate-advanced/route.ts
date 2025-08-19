import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

type Platform = 'x' | 'note' | 'wordpress' | 'article'

type GenerationRequest = {
  prompt: string
  platform?: Platform
  maxLength?: number
  style?: 'professional' | 'casual' | 'educational' | 'entertaining'
  tone?: 'formal' | 'friendly' | 'authoritative' | 'conversational'
  includeHashtags?: boolean
  targetAudience?: string
  contentType?: 'summary' | 'analysis' | 'tutorial' | 'opinion' | 'news'
}

interface KnowledgeItem {
  id: string
  title: string
  content: string
  content_type: string
  tags?: string[]
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

    console.log('Request params:', { prompt, platform, maxLength, style, tone, includeHashtags, targetAudience, contentType })

    const knowledgeItems = await fetchRelevantKnowledge(prompt)

    const powerfulPrompt = buildPrompt({
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

    const result = await generateWithOpenAI(powerfulPrompt, platform, maxLength)

    const content = result.content && result.content.trim().length > 0
      ? result.content.trim()
      : generateFallback(platform, maxLength)

    const responseBody = {
      success: true,
      content,
      metadata: {
        platform,
        style,
        tone,
        contentType,
        wordCount: content.length,
        usedKnowledgeCount: knowledgeItems.length,
        model: result.model,
        generationTime: result.generationTime
      },
      knowledgeSources: knowledgeItems.map((k) => ({
        title: k.title,
        contentType: k.content_type,
        relevance: 'high'
      }))
    }

    return NextResponse.json(responseBody)
  } catch (error) {
    console.error('=== Advanced Generation Error ===', error)
    return NextResponse.json({
      error: '高度なコンテンツ生成中にエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function fetchRelevantKnowledge(prompt: string): Promise<KnowledgeItem[]> {
  const supabase = createAdminClient()
  try {
    const keywords = extractKeywords(prompt)
    if (keywords.length === 0) return []

    const primary = keywords[0]
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('id,title,content,content_type,tags')
      .or(`title.ilike.%${primary}%,content.ilike.%${primary}%`)
      .limit(8)

    if (error) {
      console.warn('Supabase knowledge fetch error:', error)
      return []
    }
    return (data ?? []) as KnowledgeItem[]
  } catch (e) {
    console.warn('Knowledge fetch failed:', e)
    return []
  }
}

function extractKeywords(text: string): string[] {
  return Array.from(new Set(
    text
      .toLowerCase()
      .replace(/[\n\r\t]/g, ' ')
      .split(/[^a-zA-Z0-9ぁ-んァ-ン一-龠ー#]+/)
      .filter((s) => s && s.length >= 2)
  )).slice(0, 5)
}

function buildPrompt(input: {
  prompt: string
  platform: Platform
  maxLength: number
  style: string
  tone: string
  includeHashtags: boolean
  targetAudience: string
  contentType: string
  knowledgeItems: KnowledgeItem[]
}): string {
  const { prompt, platform, maxLength, style, tone, includeHashtags, targetAudience, contentType, knowledgeItems } = input
  const kb = knowledgeItems
    .map((k, i) => `- (${i + 1}) ${k.title}: ${truncate(k.content, 300)}`)
    .join('\n')

  return [
    `あなたは${platform}向けのコンテンツ生成専門家です。以下の制約と知識を踏まえて、最高品質の日本語テキストを作成してください。`,
    '',
    '【制約】',
    `- 文字数は${maxLength}文字以内`,
    `- スタイル: ${style} / トーン: ${tone}`,
    `- 対象読者: ${targetAudience}`,
    `- コンテンツ種別: ${contentType}`,
    includeHashtags ? '- 適切ならハッシュタグも付与' : '- ハッシュタグは不要',
    '',
    '【参考知識（優先度高）】',
    kb || '- (該当なし)',
    '',
    '【出力要件】',
    '- 具体的な数値・事例・ステップを含める',
    '- 繰り返しを避け、読みやすく',
    '- 日本語で、完結に',
    '',
    '【ユーザーの要望】',
    prompt
  ].join('\n')
}

function truncate(text: string, max: number): string {
  if (!text) return ''
  return text.length <= max ? text : text.slice(0, max - 3) + '...'
}

async function generateWithOpenAI(prompt: string, platform: Platform, maxLength: number): Promise<{ content: string; model: string; generationTime: number; }> {
  const start = Date.now()
  const apiKey = process.env.OPEN_AI_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn('OPENAI API KEY not set')
    return { content: '', model: 'no-api-key', generationTime: Date.now() - start }
  }

  // Helper to call chat.completions
  const call = async (model: string) => {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a helpful Japanese writing assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.85,
        max_tokens: Math.min(Math.max(64, Math.floor(maxLength * 3)), 1500),
        top_p: 0.95,
        frequency_penalty: 0.3,
        presence_penalty: 0.2,
        // OpenAIはstopの最大長が4。\n\n, --- , ### , ## のみ
        stop: ['\n\n', '---', '###', '##']
      })
    })
    return res
  }

  try {
    // 1st: gpt-4o
    let res = await call('gpt-4o')
    if (res.ok) {
      const data = await res.json()
      const content: string = data?.choices?.[0]?.message?.content ?? ''
      return { content, model: 'gpt-4o', generationTime: Date.now() - start }
    }

    // 2nd: gpt-4o-mini
    res = await call('gpt-4o-mini')
    if (res.ok) {
      const data = await res.json()
      const content: string = data?.choices?.[0]?.message?.content ?? ''
      return { content, model: 'gpt-4o-mini', generationTime: Date.now() - start }
    }

    // Error payload logging (non-fatal)
    try { console.warn('OpenAI error payload:', await res.json()) } catch { /* ignore */ }
    return { content: '', model: 'openai-error', generationTime: Date.now() - start }
  } catch (e) {
    console.warn('OpenAI request failed:', e)
    return { content: '', model: 'openai-exception', generationTime: Date.now() - start }
  }
}

function generateFallback(platform: Platform, maxLength: number): string {
  const templates: Record<Platform, string[]> = {
    x: [
      '最新の研究では、日々の小さな行動変化が成果の積み上げに最も効くと示されています。今日の一歩を具体化し、24時間以内に実践しましょう。',
      '学習×実践×振り返りのループを回すほど、知識は定着します。15分の実験を今日作り、明日改善していきましょう。'
    ],
    note: [
      '継続的な学習と小さな検証が、明日の成果を形作ります。今から15分、テーマを決めて短いアウトプットに挑戦してみませんか。',
      '知識は使ってこそ価値になります。具体例と数字で語り、読者が一歩踏み出せる指針を示しましょう。'
    ],
    wordpress: [
      '読者の課題に直結する情報を、構造化して簡潔に。1つの課題→3つの打ち手→明日のアクションの順でまとめると、行動につながります。',
      'SEOは「明確な意図×具体的解決」。見出しで期待を明示し、本文で数値・手順・実例をセットにして提示しましょう。'
    ],
    article: [
      '論点→根拠→示唆の順で整理すると、読者の理解が深まります。データや実例を添えて、次の一歩を促しましょう。',
      '継続的な研究と実践の記録は、長期的な価値を生みます。観察した事実と得られた示唆を、短くても定期的に共有しましょう。'
    ]
  }
  const pool = templates[platform] ?? templates.x
  const base = pool[Math.floor(Math.random() * pool.length)]
  return base.length > maxLength ? base.slice(0, maxLength - 3) + '...' : base
}