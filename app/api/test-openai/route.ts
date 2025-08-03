import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // 環境変数の確認
    const openaiKey = process.env.OPENAI_API_KEY
    
    if (!openaiKey) {
      return NextResponse.json({
        success: false,
        error: 'OPENAI_API_KEY is not set',
        hasKey: false
      })
    }

    // キーの一部を表示（セキュリティのため最初と最後の数文字のみ）
    const keyPreview = `${openaiKey.substring(0, 8)}...${openaiKey.substring(openaiKey.length - 4)}`
    
    // シンプルなテストリクエスト
    console.log('Testing OpenAI API connection...')
    
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
      }
    })

    const responseText = await response.text()
    
    if (response.ok) {
      const data = JSON.parse(responseText)
      return NextResponse.json({
        success: true,
        message: 'OpenAI API is working',
        hasKey: true,
        keyPreview,
        modelsCount: data.data?.length || 0,
        status: response.status
      })
    } else {
      console.error('OpenAI API test failed:', response.status, responseText)
      
      let errorData
      try {
        errorData = JSON.parse(responseText)
      } catch {
        errorData = { message: responseText }
      }
      
      return NextResponse.json({
        success: false,
        error: 'OpenAI API test failed',
        hasKey: true,
        keyPreview,
        status: response.status,
        errorDetails: errorData
      })
    }
  } catch (error) {
    console.error('OpenAI test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to test OpenAI API',
      errorMessage: error instanceof Error ? error.message : String(error)
    })
  }
}