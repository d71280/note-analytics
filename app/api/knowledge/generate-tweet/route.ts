import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('Knowledge generate-tweet API called')
    const { prompt } = await request.json()
    console.log('Request params:', { prompt })

    // シンプルなプロンプト構築
    const userPrompt = prompt || "AI活用に関する興味深いツイートを生成してください"
    
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
            model: 'grok-4',
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
          generatedTweet = grokData.choices[0].message.content
          console.log('Successfully extracted tweet:', generatedTweet)
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
      usedKnowledge: 0,
      model: grokApiKey ? 'grok' : 'fallback'
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