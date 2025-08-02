import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { question, useKnowledgeBase = true } = await request.json()

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      )
    }

    let context = ''
    interface KnowledgeItem {
      title: string
      content_type: string
    }
    let usedKnowledgeItems: KnowledgeItem[] = []

    if (useKnowledgeBase) {
      const supabase = createClient()

      // 質問に関連する知識ベースコンテンツを検索
      const { data: searchResults, error } = await supabase
        .from('knowledge_base')
        .select('title, content, content_type, tags')
        .or(`title.ilike.%${question}%,content.ilike.%${question}%`)
        .order('created_at', { ascending: false })
        .limit(3) // 最も関連性の高い3件を使用

      if (!error && searchResults && searchResults.length > 0) {
        // 検索結果をコンテキストとして整形
        context = searchResults.map((item, index) => {
          return `[知識ベース ${index + 1}]
タイトル: ${item.title}
タイプ: ${item.content_type}
内容: ${item.content.substring(0, 500)}...`
        }).join('\n\n')

        usedKnowledgeItems = searchResults.map(item => ({
          title: item.title,
          content_type: item.content_type
        }))

        console.log(`Found ${searchResults.length} relevant knowledge items`)
      }
    }

    // Grok APIで回答を生成
    const grokApiKey = process.env.GROK_API_KEY

    if (!grokApiKey) {
      return NextResponse.json({
        success: false,
        answer: '申し訳ございません。現在AI機能が利用できません。',
        usedKnowledge: 0
      })
    }

    const systemPrompt = context ? 
      `あなたは知識ベースを活用して質問に答える専門家です。以下の知識ベースの情報を参考にして、ユーザーの質問に正確かつ詳細に答えてください。

参考情報:
${context}

重要な指示:
- 知識ベースの情報を優先的に使用してください
- 知識ベースにない情報については、一般的な知識で補完してください
- 回答は明確で分かりやすく、日本語で答えてください` :
      'あなたは質問に対して正確かつ詳細に答える専門家です。日本語で分かりやすく回答してください。'

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
              content: systemPrompt
            },
            {
              role: 'user',
              content: question
            }
          ],
          model: 'grok-2-latest',
          stream: false,
          temperature: 0.7,
          max_tokens: 1000
        })
      })

      if (!grokResponse.ok) {
        throw new Error('Grok API request failed')
      }

      const grokData = await grokResponse.json()

      if (grokData.choices && grokData.choices[0] && grokData.choices[0].message) {
        const answer = grokData.choices[0].message.content

        return NextResponse.json({
          success: true,
          answer: answer,
          usedKnowledge: usedKnowledgeItems.length,
          knowledgeItems: usedKnowledgeItems,
          model: 'grok-2-latest'
        })
      }
    } catch (grokError) {
      console.error('Grok API error:', grokError)
    }

    // フォールバック回答
    return NextResponse.json({
      success: false,
      answer: '申し訳ございません。回答の生成中にエラーが発生しました。',
      usedKnowledge: 0
    })

  } catch (error) {
    console.error('Ask API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}