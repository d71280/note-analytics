import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { prompt, useKnowledge = true } = await request.json()

    const supabase = createClient()

    // 知識ベースから関連コンテンツを取得
    let relevantContent: Array<{
      id?: string
      title: string
      content: string
      content_type: string
      tags?: string[]
    }> = []
    if (useKnowledge) {
      // キーワードベースの検索（ベクトル検索は後で実装）
      const searchKeywords = ['note', 'AI', '開発', 'トレンド']
      
      const { data: knowledgeItems } = await supabase
        .from('knowledge_base')
        .select('id, title, content, content_type, tags')
        .or(searchKeywords.map(kw => `content.ilike.%${kw}%`).join(','))
        .limit(5)

      relevantContent = knowledgeItems || []
    }

    // プロンプトを構築
    const systemPrompt = `あなたは知識豊富なコンテンツクリエイターです。
以下の知識ベースの情報を参考に、魅力的なツイートを生成してください。

知識ベースの情報:
${relevantContent.map(item => `
【${item.title}】
タイプ: ${item.content_type}
内容の要約: ${item.content.substring(0, 200)}...
タグ: ${item.tags?.join(', ') || 'なし'}
`).join('\n')}

ツイートの条件:
- 280文字以内
- 読者に価値を提供する内容
- 親しみやすい口調
- 適切なハッシュタグを含める
- 知識ベースの情報を自然に活用`

    const userPrompt = prompt || '最新のトレンドについて有益な情報をツイート'

    // AIでツイートを生成
    let generatedTweet = ''

    // Grok APIが利用可能な場合
    const { data: grokConfig, error: grokError } = await supabase
      .from('grok_api_configs')
      .select('api_key, enabled')
      .single()
    
    if (grokError) {
      console.log('Grok config not found, using environment variables:', grokError.message)
    }

    // Grok APIキーが利用可能かチェック（データベースまたは環境変数）
    const grokApiKey = grokConfig?.api_key || process.env.GROK_API_KEY
    
    if ((grokConfig?.enabled || process.env.GROK_API_KEY) && grokApiKey) {
      // Grok APIを使用（実装済み）
      const response = await fetch(`${request.nextUrl.origin}/api/x/generate-tweet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'custom',
          prompt: `${systemPrompt}\n\n${userPrompt}`,
          useGrok: true
        })
      })
      const data = await response.json()
      generatedTweet = data.tweet
    } else {
      // Gemini APIを使用
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`
      const result = await model.generateContent(fullPrompt)
      generatedTweet = result.response.text()
    }

    // 生成履歴を保存
    if (relevantContent.length > 0) {
      await supabase
        .from('knowledge_generation_history')
        .insert({
          prompt: userPrompt,
          generated_content: generatedTweet,
          used_knowledge_ids: relevantContent.map(item => item.id).filter((id): id is string => id !== undefined),
          model: grokConfig?.enabled ? 'grok' : 'gemini'
        })
    }

    return NextResponse.json({
      success: true,
      tweet: generatedTweet,
      usedKnowledge: relevantContent.length,
      model: grokConfig?.enabled ? 'grok' : 'gemini'
    })
  } catch (error) {
    console.error('Generate tweet error:', error)
    return NextResponse.json(
      { error: 'Failed to generate tweet' },
      { status: 500 }
    )
  }
}