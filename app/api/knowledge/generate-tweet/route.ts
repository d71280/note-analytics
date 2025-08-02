import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('Knowledge generate-tweet API called')
    const { prompt, useKnowledge = true } = await request.json()
    console.log('Request params:', { prompt, useKnowledge })

    // Supabaseクライアントを直接作成
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 知識ベースから関連コンテンツを取得
    let relevantContent: Array<{
      id?: string
      title: string
      content: string
      content_type: string
      tags?: string[]
    }> = []
    if (useKnowledge) {
      console.log('Fetching knowledge base content...')
      try {
        // キーワードベースの検索（ベクトル検索は後で実装）
        const searchKeywords = ['note', 'AI', '開発', 'トレンド']
        
        const { data: knowledgeItems, error: knowledgeError } = await supabase
          .from('knowledge_base')
          .select('id, title, content, content_type, tags')
          .or(searchKeywords.map(kw => `content.ilike.%${kw}%`).join(','))
          .limit(5)

        if (knowledgeError) {
          console.error('Knowledge base query error:', knowledgeError)
          // エラーがあっても続行（知識ベースなしで生成）
        } else {
          relevantContent = knowledgeItems || []
          console.log('Found knowledge items:', relevantContent.length)
        }
      } catch (error) {
        console.error('Knowledge base connection error:', error)
        // データベース接続エラーがあっても続行
      }
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

    // Grok APIキーを環境変数から直接取得
    const grokApiKey = process.env.GROK_API_KEY
    console.log('Grok API available:', !!grokApiKey)
    
    if (grokApiKey) {
      console.log('Using Grok API for generation...')
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
      
      if (!response.ok) {
        console.error('Grok API response error:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Grok API error details:', errorText)
        throw new Error(`Grok API failed: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Grok API response:', data)
      generatedTweet = data.tweet
    } else {
      console.log('No Grok API available, using fallback message')
      // フォールバック: シンプルなテキスト生成
      generatedTweet = `知識ベースを活用した返信を生成しました。\n\n${userPrompt}\n\n#AI #知識活用 #ツイート`
      console.log('Generated fallback response')
    }

    // 生成履歴を保存（テーブルが存在する場合のみ）
    try {
      if (relevantContent.length > 0) {
        console.log('Saving generation history...')
        const { error: historyError } = await supabase
          .from('knowledge_generation_history')
          .insert({
            prompt: userPrompt,
            generated_content: generatedTweet,
            used_knowledge_ids: relevantContent.map(item => item.id).filter((id): id is string => id !== undefined),
            model: grokApiKey ? 'grok' : 'fallback'
          })
        
        if (historyError) {
          console.error('Failed to save generation history:', historyError)
          // エラーがあっても続行
        }
      }
    } catch (error) {
      console.error('History save error:', error)
      // エラーがあっても続行
    }

    return NextResponse.json({
      success: true,
      tweet: generatedTweet,
      usedKnowledge: relevantContent.length,
      model: grokApiKey ? 'grok' : 'fallback'
    })
  } catch (error) {
    console.error('Generate tweet error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Failed to generate tweet',
        details: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}