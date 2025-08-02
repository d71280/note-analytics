import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    console.log('Knowledge generate-tweet API called')
    const { prompt } = await request.json()
    console.log('Request params:', { prompt })

    let knowledgeItems = []
    let knowledgeContent = ''

    // Supabase設定確認
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    console.log('Supabase URL configured:', !!supabaseUrl && !supabaseUrl.includes('your_supabase'))
    console.log('Supabase Key configured:', !!supabaseKey && !supabaseKey.includes('your_supabase'))

    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your_supabase') && !supabaseKey.includes('your_supabase')) {
      // 実際のSupabaseから知識ベースのコンテンツを取得
      try {
        const supabase = createClient()
        console.log('Fetching knowledge base content from Supabase...')
        
        const { data, error } = await supabase
          .from('knowledge_base')
          .select('title, content, content_type, tags')
          .order('created_at', { ascending: false })
          .limit(5) // 最新5件を取得

        if (error) {
          console.error('Knowledge base fetch error:', error)
          throw error
        }

        knowledgeItems = data || []
        console.log('Knowledge items found from Supabase:', knowledgeItems.length)
      } catch (error) {
        console.error('Supabase connection error:', error)
        knowledgeItems = []
      }
    }

    // Supabaseから取得できない場合はモックデータを使用
    if (knowledgeItems.length === 0) {
      console.log('Using mock knowledge base data...')
      knowledgeItems = [
        {
          title: 'コンテンツ-脳内OS強化 指南書',
          content: '2025年のトレンドとして注目される「脳内OS強化」について詳しく解説。情報処理能力の向上、思考の整理術、効率的な学習方法などを網羅的に説明。現代社会において必要なスキルを身につけるための実践的なガイドブック。',
          content_type: 'note',
          tags: ['脳内OS', 'スキルアップ', '学習', 'トレンド', '自己啓発']
        },
        {
          title: 'AI活用による生産性向上術',
          content: 'ChatGPTやGrokなどのAIツールを効果的に活用して、日常業務の生産性を大幅に向上させる方法について詳細に解説。プロンプトエンジニアリング、業務自動化、創作活動でのAI活用などの実践的なテクニックを紹介。',
          content_type: 'blog',
          tags: ['AI', 'ChatGPT', 'Grok', '生産性', '業務効率化']
        }
      ]
    }

    knowledgeContent = knowledgeItems.length > 0 
      ? knowledgeItems.map(item => `タイトル: ${item.title}\nタイプ: ${item.content_type}\nコンテンツ: ${item.content}\nタグ: ${item.tags?.join(', ') || 'なし'}`).join('\n\n---\n\n')
      : 'まだ知識ベースにコンテンツが登録されていません。'

    console.log('Final knowledge items count:', knowledgeItems.length)
    console.log('Knowledge content preview:', knowledgeContent.substring(0, 200) + '...')

    // プロンプトに知識ベースの内容を含める
    const userPrompt = prompt 
      ? `以下の知識ベースの情報を参考にして、「${prompt}」についてのツイートを生成してください：\n\n${knowledgeContent}`
      : `以下の知識ベースの情報を参考にして、魅力的なツイートを生成してください：\n\n${knowledgeContent}`
    
    // Grok APIキーを環境変数から取得
    const grokApiKey = process.env.GROK_API_KEY
    console.log('Grok API available:', !!grokApiKey)
    console.log('Grok API key preview:', grokApiKey ? `${grokApiKey.substring(0, 10)}...` : 'NOT_FOUND')
    
    let generatedTweet = ''
    
    if (grokApiKey) {
      console.log('Using Grok API for generation...')
      try {
        // Grok APIを直接呼び出し
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
                content: 'あなたは魅力的で価値のあるツイートを生成する専門家です。280文字以内で、読者に価値を提供する内容を生成してください。'
              },
              {
                role: 'user',
                content: userPrompt
              }
            ],
            model: 'grok-2-latest',
            stream: false,
            temperature: 0.7,
            max_tokens: 200
          })
        })
        
        if (!grokResponse.ok) {
          const errorText = await grokResponse.text()
          console.error('Grok API response error:', {
            status: grokResponse.status,
            statusText: grokResponse.statusText,
            headers: Object.fromEntries(grokResponse.headers.entries()),
            body: errorText
          })
          throw new Error(`Grok API failed: ${grokResponse.status} - ${errorText}`)
        }
        
        const grokData = await grokResponse.json()
        console.log('Grok API response:', JSON.stringify(grokData, null, 2))
        
        if (grokData.choices && grokData.choices[0] && grokData.choices[0].message) {
          generatedTweet = grokData.choices[0].message.content || ''
          console.log('Successfully extracted tweet:', generatedTweet)
          
          // 空のレスポンスの場合はエラーとして扱う
          if (!generatedTweet.trim()) {
            console.warn('Grok returned empty content, using fallback')
            throw new Error('Grok returned empty content')
          }
        } else {
          console.error('Unexpected Grok API response structure:', grokData)
          throw new Error('Invalid response structure from Grok API')
        }
      } catch (error) {
        console.error('Grok API error:', error)
        generatedTweet = `知識ベースを活用した返信：\n\n${userPrompt}\n\n#AI #ツイート生成`
      }
    } else {
      console.log('No Grok API available, using fallback')
      // フォールバック: シンプルなテキスト生成
      generatedTweet = `知識ベースを活用した返信：\n\n${userPrompt}\n\n#AI #知識活用 #ツイート`
    }

    console.log('Generated tweet:', generatedTweet)

    return NextResponse.json({
      success: true,
      tweet: generatedTweet,
      usedKnowledge: knowledgeItems?.length || 0,
      model: grokApiKey ? 'grok-2-latest' : 'fallback',
      knowledgeItems: knowledgeItems?.map(item => ({ 
        title: item.title, 
        content_type: item.content_type 
      })) || []
    })
  } catch (error) {
    console.error('Generate tweet error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Failed to generate tweet',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}