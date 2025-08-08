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

    // 知識ベースの詳細情報を提供（より多くの情報を活用）
    knowledgeContent = knowledgeItems.length > 0 
      ? knowledgeItems.map(item => 
          `【${item.title}】
内容: ${item.content.substring(0, 400)}...
タイプ: ${item.content_type}
タグ: ${item.tags?.join(', ') || 'なし'}`
        ).join('\n\n')
      : '一般的な知識に基づいて'

    console.log('Final knowledge items count:', knowledgeItems.length)
    console.log('Knowledge content preview:', knowledgeContent.substring(0, 200) + '...')

    // 強力なコンテンツ生成のためのプロンプト
    const userPrompt = platform === 'x'
      ? (prompt 
        ? `以下の知識ベースの概念を参考にして、「${prompt}」について${maxLength}文字以内の強力なツイートを1つ生成してください。具体的で実用的な情報を含めてください。\n\n参考知識：\n${knowledgeContent}` 
        : `以下の知識ベースの概念を参考にして、${maxLength}文字以内の強力なツイートを1つ生成してください。具体的で実用的な情報を含めてください。\n\n参考知識：\n${knowledgeContent}`)
      : (prompt 
        ? `以下の知識ベースの概念を参考にして、「${prompt}」についての強力なコンテンツを生成してください。具体的で実用的な情報を含めてください：\n\n参考知識：\n${knowledgeContent}`
        : `以下の知識ベースの概念を参考にして、魅力的で強力なコンテンツを生成してください。具体的で実用的な情報を含めてください：\n\n参考知識：\n${knowledgeContent}`)
    
    let generatedTweet = ''
    let aiModel = 'fallback'
    
    // AI生成を試行（Grok → Gemini → シンプルな文字列）
    const grokApiKey = process.env.GROK_API_KEY
    const geminiApiKey = process.env.GEMINI_API_KEY
    
    console.log('AI service availability:', {
      grok: !!grokApiKey,
      gemini: !!geminiApiKey
    })
    
    // 1. Grok APIを試行（より強力な設定）
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
                  ? `あなたはX(Twitter)の投稿専門家です。最高品質のツイートを作成してください。

【重要な指示】
- 知識ベースの概念を参考にし、具体的で実用的な情報を提供する
- 読者の行動を促す内容にする
- 抽象的な表現を避け、具体的な例や数値を含める
- 読者の問題解決に直接的に役立つ内容にする

【絶対条件】
- 出力は${maxLength}文字以内に収める
- 1つの短い文章で完結させる
- ハッシュタグ（#から始まる単語）は絶対に含めない
- 長い説明や複数段落は絶対に生成しない
- 簡潔で印象的な内容にする
- 具体的で実用的な情報を含める

【品質基準】
- 明確で分かりやすい表現
- 実践的な価値を提供
- 読者の興味を引く内容
- 信頼性の高い情報
- 行動を促す要素を含む

出力例（${maxLength}文字以内）:
「最新の研究によると、継続的な学習は生産性を平均47%向上させます。毎日30分の学習時間を確保することで、3ヶ月後には明確な成長を実感できるでしょう。」`
                  : platform === 'note'
                  ? `あなたはNoteの記事要約を生成する専門家です。知識ベースの概念を参考にしながら、完全にオリジナルの強力な要約を${maxLength}文字以内で生成してください。具体的で実用的な情報を含めてください。`
                  : `あなたはSEOを意識したブログ記事の抜粋を生成する専門家です。知識ベースの概念を参考にしながら、${maxLength}文字以内で読者を引き込む強力なオリジナルコンテンツを生成してください。具体的で実用的な情報を含めてください。`
              },
              {
                role: 'user',
                content: userPrompt
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
    
    // 2. Grokが失敗した場合、Gemini APIを試行（より強力な設定）
    if (!generatedTweet && geminiApiKey) {
      console.log('Falling back to Gemini API...')
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

        const systemPrompt = platform === 'x' 
          ? `あなたはX(Twitter)の投稿専門家です。知識ベースの概念を参考にしながら、${maxLength}文字以内で強力なオリジナルのツイートを生成してください。具体的で実用的な情報を含めてください。ハッシュタグ（#から始まる単語）は絶対に含めないでください。`
          : `あなたはコンテンツ生成の専門家です。知識ベースの概念を参考にしながら、${maxLength}文字以内で魅力的で強力なオリジナルコンテンツを生成してください。具体的で実用的な情報を含めてください。`
        
        const fullPrompt = `${systemPrompt}\n\n${userPrompt}`
        const result = await genModel.generateContent(fullPrompt)
        const response = await result.response
        generatedTweet = response.text() || ''
        aiModel = 'gemini-pro'
        console.log('Gemini API success!')
      } catch (error) {
        console.warn('Gemini API error:', error instanceof Error ? error.message : 'Unknown error')
      }
    }
    
    // 3. 全てのAIが失敗した場合、知識ベースから強力なコンテンツを生成
    if (!generatedTweet) {
      console.log('All AI services failed, generating powerful content from knowledge base...')
      
      if (knowledgeItems.length > 0) {
        const randomItem = knowledgeItems[Math.floor(Math.random() * knowledgeItems.length)]
        
        if (platform === 'x') {
          // Twitter用の強力なフォーマット
          const powerfulTemplates = [
            `最新の研究によると、${randomItem.title}の実践により生産性が平均47%向上します。毎日30分の実践で3ヶ月後に明確な成長を実感できます。`,
            `${randomItem.title}の効果的な活用により、従来の3倍の速度でスキルアップが可能です。具体的な目標設定が成功の鍵です。`,
            `成功する人とそうでない人の違いは「実践力」です。${randomItem.title}の知識を即座に実践することで、驚くほどの成果を上げることができます。`
          ]
          const template = powerfulTemplates[Math.floor(Math.random() * powerfulTemplates.length)]
          generatedTweet = template.substring(0, maxLength)
        } else {
          const powerfulTemplate = `${randomItem.title}の概念を基に、具体的で実用的なアプローチを実践することで、読者に最大の価値を提供できます。実証済みの方法論が成功の鍵です。`
          generatedTweet = powerfulTemplate.substring(0, maxLength)
        }
        
        aiModel = 'powerful-template'
        console.log('Generated powerful template-based content')
      } else {
        // 最終的なフォールバック
        const defaultContent = platform === 'x' 
          ? '最新の研究によると、継続的な学習は生産性を平均47%向上させます。毎日30分の学習時間を確保することで、3ヶ月後には明確な成長を実感できるでしょう。'
          : '継続的な学習と実践を通じて、あなたの専門性は指数関数的に向上します。今日学んだことを明日の行動に活かすことで、確実な成長を実現しましょう。'
        
        generatedTweet = defaultContent.substring(0, maxLength)
        aiModel = 'powerful-fallback'
        console.log('Used powerful fallback content')
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