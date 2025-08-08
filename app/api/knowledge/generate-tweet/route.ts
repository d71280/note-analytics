import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface KnowledgeItem {
  title: string
  content: string
  content_type: string
  tags?: string[]
}

export async function POST(request: NextRequest) {
  console.log('=== Generate Tweet API Start ===')
  console.log('Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    hasGrokKey: !!process.env.GROK_API_KEY,
    grokKeyLength: process.env.GROK_API_KEY?.length || 0,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  })
  
  try {
    const { prompt, platform = 'x', maxLength = 280 } = await request.json()
    console.log('Request params:', { prompt, platform, maxLength })

    let knowledgeItems: KnowledgeItem[] = []
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
          .limit(50) // 最新50件を取得して多様性を確保

        if (error) {
          console.error('Knowledge base fetch error:', error)
          throw error
        }

        knowledgeItems = (data as KnowledgeItem[]) || []
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

    // 知識ベースの内容を要約して提供（直接引用ではなく）
    knowledgeContent = knowledgeItems.length > 0 
      ? knowledgeItems.map(item => `【${item.title}】の要点: ${item.content.substring(0, 150)}...`).join('\n')
      : '一般的な知識に基づいて'

    console.log('Final knowledge items count:', knowledgeItems.length)
    console.log('Knowledge content preview:', knowledgeContent.substring(0, 200) + '...')

    // 創造的なコンテンツ生成のためのプロンプト
    const userPrompt = platform === 'x'
      ? (prompt 
        ? `以下の知識ベースの概念を参考にして、「${prompt}」について${maxLength}文字以内のオリジナルなツイートを1つ生成してください。直接引用は絶対にしないでください。\n\n参考知識：\n${knowledgeContent}` 
        : `以下の知識ベースの概念を参考にして、${maxLength}文字以内のオリジナルなツイートを1つ生成してください。直接引用は絶対にしないでください。\n\n参考知識：\n${knowledgeContent}`)
      : (prompt 
        ? `以下の知識ベースの概念を参考にして、「${prompt}」についてのオリジナルなコンテンツを生成してください。直接引用は絶対にしないでください：\n\n参考知識：\n${knowledgeContent}`
        : `以下の知識ベースの概念を参考にして、魅力的なオリジナルコンテンツを生成してください。直接引用は絶対にしないでください：\n\n参考知識：\n${knowledgeContent}`)
    
    let generatedTweet = ''
    let aiModel = 'fallback'
    
    // AI生成を試行（Grok → Gemini → シンプルな文字列）
    const grokApiKey = process.env.GROK_API_KEY
    const geminiApiKey = process.env.GEMINI_API_KEY
    
    console.log('AI service availability:', {
      grok: !!grokApiKey,
      gemini: !!geminiApiKey
    })
    
    // 1. Grok APIを試行
    if (grokApiKey) {
      console.log('Trying Grok API...')
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
                content: platform === 'x' 
                  ? `あなたはX(Twitter)の投稿専門家です。

【重要な指示】
- 知識ベースの内容を参考にするが、直接引用は絶対にしない
- プロンプトの指示に基づいて、オリジナルの新しいコンテンツを作成する
- 既存の文章をコピーするのではなく、新しい視点や表現で内容を展開する

【絶対条件】
- 出力は${maxLength}文字以内に収める
- 1つの短い文章で完結させる
- ハッシュタグ（#から始まる単語）は絶対に含めない
- 長い説明や複数段落は絶対に生成しない
- 簡潔で印象的な内容にする
- オリジナルの創造的な表現を使用する

出力例（${maxLength}文字以内）:
「新しい視点で学びを深めることで、驚くほどの成長を実感できます。知識の組み合わせが創造性を生み出します。」`
                  : platform === 'note'
                  ? `あなたはNoteの記事要約を生成する専門家です。知識ベースの概念を参考にしながら、完全にオリジナルの要約を${maxLength}文字以内で生成してください。直接引用は絶対にしないでください。`
                  : `あなたはSEOを意識したブログ記事の抜粋を生成する専門家です。知識ベースの概念を参考にしながら、${maxLength}文字以内で読者を引き込むオリジナルコンテンツを生成してください。直接引用は絶対にしないでください。`
              },
              {
                role: 'user',
                content: userPrompt
              }
            ],
            model: 'grok-2-latest',
            stream: false,
            temperature: 0.8, // 創造性を高めるため温度を上げる
            max_tokens: platform === 'x' ? 60 : 500
          })
        })
        
        if (grokResponse.ok) {
          const grokData = await grokResponse.json()
          if (grokData.choices && grokData.choices[0] && grokData.choices[0].message) {
            generatedTweet = grokData.choices[0].message.content || ''
            aiModel = 'grok-2-latest'
            console.log('Grok API success!')
          }
        } else {
          const errorText = await grokResponse.text()
          console.warn(`Grok API failed (${grokResponse.status}):`, errorText)
          // 429エラー（レート制限）や支払い制限の場合は警告を出してフォールバック
          if (grokResponse.status === 429) {
            console.log('Grok API rate limited or spending limit reached, falling back to alternative')
          }
        }
      } catch (error) {
        console.warn('Grok API error:', error instanceof Error ? error.message : 'Unknown error')
      }
    }
    
    // 2. Grokが失敗した場合、Gemini APIを試行
    if (!generatedTweet && geminiApiKey) {
      console.log('Falling back to Gemini API...')
      try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const genAI = new GoogleGenerativeAI(geminiApiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

        const systemPrompt = platform === 'x' 
          ? `あなたはX(Twitter)の投稿専門家です。知識ベースの概念を参考にしながら、${maxLength}文字以内でオリジナルのツイートを生成してください。直接引用は絶対にしないでください。ハッシュタグ（#から始まる単語）は絶対に含めないでください。`
          : `あなたはコンテンツ生成の専門家です。知識ベースの概念を参考にしながら、${maxLength}文字以内で魅力的なオリジナルコンテンツを生成してください。直接引用は絶対にしないでください。`
        
        const fullPrompt = `${systemPrompt}\n\n${userPrompt}`
        const result = await model.generateContent(fullPrompt)
        const response = await result.response
        generatedTweet = response.text() || ''
        aiModel = 'gemini-pro'
        console.log('Gemini API success!')
      } catch (error) {
        console.warn('Gemini API error:', error instanceof Error ? error.message : 'Unknown error')
      }
    }
    
    // 3. 全てのAIが失敗した場合、知識ベースから創造的なコンテンツを生成
    if (!generatedTweet) {
      console.log('All AI services failed, generating creative content from knowledge base...')
      
      if (knowledgeItems.length > 0) {
        const randomItem = knowledgeItems[Math.floor(Math.random() * knowledgeItems.length)]
        
        if (platform === 'x') {
          // Twitter用の創造的なフォーマット
          const creativeTemplates = [
            `新しい視点で${randomItem.title}について学ぶことで、驚くほどの成長を実感できます。`,
            `${randomItem.title}の概念を活用することで、より効果的なアプローチが可能になります。`,
            `継続的な学習と${randomItem.title}の実践を通じて、独自の価値を創造していきましょう。`
          ]
          const template = creativeTemplates[Math.floor(Math.random() * creativeTemplates.length)]
          generatedTweet = template.substring(0, maxLength)
        } else {
          const creativeTemplate = `${randomItem.title}の概念を基に、新しい視点で価値あるコンテンツを創造していくことが重要です。`
          generatedTweet = creativeTemplate.substring(0, maxLength)
        }
        
        aiModel = 'creative-template'
        console.log('Generated creative template-based content')
      } else {
        // 最終的なフォールバック
        const defaultContent = platform === 'x' 
          ? '新しい視点で学びを深めることで、驚くほどの成長を実感できます。知識の組み合わせが創造性を生み出します。'
          : '継続的な学習と実践を通じて、独自の価値を創造していくことが大切です。'
        
        generatedTweet = defaultContent.substring(0, maxLength)
        aiModel = 'creative-fallback'
        console.log('Used creative fallback content')
      }
    }
    
    // 文字数制限を適用（最終チェック）
    if (generatedTweet.length > maxLength) {
      console.log(`Content too long (${generatedTweet.length}), trimming to ${maxLength}`)
      
      if (platform === 'x') {
        // Twitter用の積極的なトリミング
        const firstSentence = generatedTweet.split('\n')[0]
        generatedTweet = firstSentence
        
        if (generatedTweet.length > maxLength) {
          const sentences = generatedTweet.split(/[。！？]/)
          let trimmed = ''
          for (const sentence of sentences) {
            if ((trimmed + sentence).length <= maxLength - 10) {
              trimmed += sentence + '。'
            } else {
              break
            }
          }
          
          if (trimmed.length === 0 || trimmed.length > maxLength) {
            generatedTweet = generatedTweet.substring(0, maxLength - 3) + '...'
          } else {
            generatedTweet = trimmed
          }
        }
      } else {
        generatedTweet = generatedTweet.substring(0, maxLength - 3) + '...'
      }
    }
    
    console.log(`Final generated content (${generatedTweet.length} chars):`, generatedTweet)

    return NextResponse.json({
      success: true,
      tweet: generatedTweet,
      usedKnowledge: knowledgeItems?.length || 0,
      model: aiModel,
      knowledgeItems: knowledgeItems?.map(item => ({ 
        title: item.title, 
        content_type: item.content_type 
      })) || []
    })
  } catch (error) {
    console.error('=== Generate Tweet Error ===')
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'コンテンツ生成中にエラーが発生しました',
        details: errorMessage,
        message: `エラー: ${errorMessage}`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}