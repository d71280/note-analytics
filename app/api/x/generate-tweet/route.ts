import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

interface TweetGenerationRequest {
  type: 'trend' | 'article' | 'custom'
  data: Record<string, unknown>
  useGrok?: boolean
  prompt?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as TweetGenerationRequest
    const { type, data, prompt } = body
    let useGrok = body.useGrok !== undefined ? body.useGrok : true

    let systemPrompt = ''
    let userPrompt = ''

    switch (type) {
      case 'trend':
        systemPrompt = `あなたはnoteのトレンドを魅力的に紹介するライターです。
以下の条件でツイートを生成してください：
- 280文字以内（URLを含む場合は23文字として計算）
- ハッシュタグを2-3個含める
- エンゲージメントを促す内容
- 絵文字を適度に使用`
        
        userPrompt = `本日のnoteトレンドデータ：
${JSON.stringify(data, null, 2)}

このデータから魅力的なツイートを生成してください。`
        break

      case 'article':
        systemPrompt = `あなたはnoteの記事を紹介するライターです。
以下の条件でツイートを生成してください：
- 280文字以内
- 記事の魅力を簡潔に伝える
- 著者名を含める
- 適切なハッシュタグを追加`
        
        userPrompt = `以下の記事を紹介するツイートを生成してください：
タイトル: ${data.title}
著者: ${data.author}
URL: ${data.url}
概要: ${data.summary || ''}
閲覧数: ${data.views || 0}`
        break

      case 'custom':
        systemPrompt = `あなたはSNSマーケティングの専門家です。
効果的なツイートを生成してください。`
        userPrompt = prompt || ''
        break
    }

    let generatedTweet = ''

    if (useGrok && process.env.GROK_API_KEY) {
      // Grok APIを使用
      try {
        const response = await axios.post(
          process.env.GROK_API_URL || 'https://api.x.ai/v1/chat/completions',
          {
            model: 'grok-2-latest',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            max_tokens: 200,
            temperature: 0.7
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        )

        generatedTweet = response.data.choices[0].message.content
        console.log('Grok API success')
      } catch (error) {
        console.warn('Grok API error:', error instanceof Error ? error.message : 'Unknown error')
        // 429エラー（レート制限）の場合は特別にログを出力
        if (axios.isAxiosError(error) && error.response?.status === 429) {
          console.log('Grok API rate limited, falling back to Gemini')
        }
        // Grokが失敗した場合はGeminiにフォールバック
        useGrok = false
      }
    }

    // GrokがないかエラーになったらGemini APIを使用
    if (!useGrok || !generatedTweet) {
      if (process.env.GEMINI_API_KEY) {
        console.log('Falling back to Gemini API')
        try {
          const { GoogleGenerativeAI } = await import('@google/generative-ai')
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
          const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

          const fullPrompt = `${systemPrompt}\n\n${userPrompt}`
          const result = await model.generateContent(fullPrompt)
          generatedTweet = result.response.text()
          console.log('Gemini API success')
        } catch (error) {
          console.warn('Gemini API error:', error instanceof Error ? error.message : 'Unknown error')
          // Geminiも失敗した場合はシンプルなフォールバック
          generatedTweet = 'AIコンテンツ生成が一時的に利用できません。しばらく待ってから再試行してください。 #AI #コンテンツ生成'
          console.log('Using fallback content')
        }
      } else {
        console.warn('No Gemini API key available')
        generatedTweet = 'AIコンテンツ生成が一時的に利用できません。しばらく待ってから再試行してください。 #AI #コンテンツ生成'
      }
    }

    // 280文字制限をチェック
    if (generatedTweet.length > 280) {
      generatedTweet = generatedTweet.substring(0, 277) + '...'
    }

    // AIモデルを判定
    let aiModel = 'fallback'
    if (generatedTweet && generatedTweet.includes('一時的に利用できません')) {
      aiModel = 'fallback'
    } else if (useGrok && process.env.GROK_API_KEY) {
      aiModel = 'grok-2-latest'
    } else if (process.env.GEMINI_API_KEY) {
      aiModel = 'gemini-pro'
    }

    return NextResponse.json({
      success: true,
      tweet: generatedTweet,
      aiModel
    })
  } catch (error) {
    console.error('Tweet generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate tweet' },
      { status: 500 }
    )
  }
}