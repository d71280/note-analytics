import { NextResponse } from 'next/server'

export async function GET() {
  console.log('=== GPT-4o Test API Start ===')
  
  try {
    const openaiApiKey = process.env.OPEN_AI_KEY
    
    if (!openaiApiKey) {
      return NextResponse.json({
        error: 'OPEN_AI_KEY環境変数が設定されていません',
        status: 'not_configured'
      })
    }

    console.log('OpenAI API Key exists:', !!openaiApiKey)
    console.log('API Key prefix:', openaiApiKey.substring(0, 7) + '...')

    // 簡単なGPT-4oテスト
    const testResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'こんにちは、GPT-4oモデルでテストメッセージを生成してください。'
          }
        ],
        model: 'gpt-4o',
        max_tokens: 50
      })
    })

    if (testResponse.ok) {
      const data = await testResponse.json()
      return NextResponse.json({
        success: true,
        model: 'gpt-4o',
        response: data.choices?.[0]?.message?.content || 'No content',
        status: 'working'
      })
    } else {
      const errorData = await testResponse.json()
      return NextResponse.json({
        error: 'GPT-4o API呼び出しに失敗しました',
        details: errorData,
        status: 'api_error'
      })
    }

  } catch (error) {
    console.error('GPT-4o Test Error:', error)
    return NextResponse.json({
      error: 'GPT-4oテスト中にエラーが発生しました',
      details: error instanceof Error ? error.message : 'Unknown error',
      status: 'error'
    })
  }
} 