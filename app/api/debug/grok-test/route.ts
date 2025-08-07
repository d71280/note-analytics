import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // 環境変数の確認
    const grokApiKey = process.env.GROK_API_KEY
    
    if (!grokApiKey) {
      return NextResponse.json({
        success: false,
        error: 'GROK_API_KEY is not set',
        hasKey: false
      })
    }

    // キーの一部を表示（セキュリティのため最初と最後の数文字のみ）
    const keyPreview = `${grokApiKey.substring(0, 8)}...${grokApiKey.substring(grokApiKey.length - 4)}`
    
    // シンプルなテストリクエスト
    console.log('Testing Grok API connection...')
    
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${grokApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Reply with a simple "OK" message.'
          },
          {
            role: 'user',
            content: 'Test'
          }
        ],
        model: 'grok-2-latest',
        stream: false,
        temperature: 0.1,
        max_tokens: 10
      })
    })

    const responseText = await response.text()
    
    if (response.ok) {
      const data = JSON.parse(responseText)
      return NextResponse.json({
        success: true,
        message: 'Grok API is working',
        hasKey: true,
        keyPreview,
        response: data.choices?.[0]?.message?.content || 'No content',
        status: response.status
      })
    } else {
      console.error('Grok API test failed:', response.status, responseText)
      
      let errorData
      try {
        errorData = JSON.parse(responseText)
      } catch {
        errorData = { message: responseText }
      }
      
      return NextResponse.json({
        success: false,
        error: 'Grok API test failed',
        hasKey: true,
        keyPreview,
        status: response.status,
        errorDetails: errorData
      })
    }
  } catch (error) {
    console.error('Grok test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to test Grok API',
      errorMessage: error instanceof Error ? error.message : String(error)
    })
  }
}