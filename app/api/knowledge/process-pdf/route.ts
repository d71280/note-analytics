import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { content, fileName, userPrompt, isExtractedText } = await request.json()

    if (!content || !fileName) {
      return NextResponse.json(
        { error: 'Content and fileName are required' },
        { status: 400 }
      )
    }
    
    // ファイルサイズチェック（10MB制限）
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (content.length > maxSize) {
      return NextResponse.json(
        { 
          error: 'PDFファイルが大きすぎます',
          details: `ファイルサイズ: ${Math.round(content.length / 1024 / 1024)}MB`,
          hint: '10MB以下のPDFファイルをアップロードしてください'
        },
        { status: 400 }
      )
    }

    // 環境変数の確認（デバッグ用）
    console.log('Environment check:', {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasGrok: !!process.env.GROK_API_KEY,
      openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0
    })

    // 既にテキストが抽出されている場合
    if (isExtractedText) {
      console.log('PDFテキストが既に抽出されています。文字数:', content.length)
      
      // 抽出されたテキストを整形
      let formattedText = `PDFファイル: ${fileName}\n\n`
      formattedText += `=== 抽出された内容 ===\n\n`
      formattedText += content
      formattedText += `\n\n=== ファイル情報 ===\n`
      formattedText += `ファイル名: ${fileName}\n`
      formattedText += `抽出文字数: ${content.length}文字\n`
      formattedText += `処理日時: ${new Date().toLocaleString('ja-JP')}\n`
      formattedText += `解析方法: クライアントサイドPDF.js`
      
      return NextResponse.json({
        success: true,
        text: formattedText,
        fileName: fileName,
        analyzedBy: 'client-side-pdfjs'
      })
    }
    
    // 以前の処理（base64データの場合）
    const base64Data = content.replace(/^data:application\/pdf;base64,/, '')
    let extractedText = ''
    
    // APIキーを確認
    const grokApiKey = process.env.GROK_API_KEY
    const openaiApiKey = process.env.OPENAI_API_KEY
    
    // OpenAI APIを優先的に使用
    if (openaiApiKey) {
      try {
        console.log('OpenAI API Key exists:', !!openaiApiKey)
        console.log('OpenAI Key length:', openaiApiKey.length)
        console.log('OpenAI Key prefix:', openaiApiKey.substring(0, 10) + '...')
        console.log('Sending PDF to OpenAI GPT-4 Vision for analysis...')
        
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'あなたはPDFドキュメントの内容を理解し、構造化されたテキストとして整理する専門家です。PDFの全てのテキスト内容を正確に抽出し、章立てや重要なポイントを明確に整理して日本語で出力してください。'
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `以下のPDFファイルの全ての内容を抽出し、構造化された形式で出力してください。\n\nファイル名: ${fileName}\n${userPrompt ? `\nユーザーからの追加情報:\n${userPrompt}\n` : ''}\n指示:\n1. PDFの全てのテキスト内容を正確に抽出してください\n2. 省略せずに全文を含めてください\n3. 元の構造を保持しながら、読みやすい形式に整理してください\n4. 章立て、見出し、箇条書きなどの構造を明確にしてください`
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: content,
                      detail: 'high' // 高解像度で解析
                    }
                  }
                ]
              }
            ],
            max_tokens: 4000,
            temperature: 0.1
          })
        })

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json()
          
          if (openaiData.choices && openaiData.choices[0] && openaiData.choices[0].message) {
            const extractedContent = openaiData.choices[0].message.content
            console.log('OpenAI successfully analyzed PDF')
            
            // コンテンツにメタ情報を追加
            extractedText = `PDFファイル: ${fileName}\n\n`
            extractedText += `=== OpenAI GPT-4 VisionによるPDF内容抽出 ===\n\n`
            extractedText += extractedContent
            extractedText += `\n\n=== ファイル情報 ===\n`
            extractedText += `ファイル名: ${fileName}\n`
            extractedText += `ファイルサイズ: ${Math.round(base64Data.length * 0.75 / 1024)}KB\n`
            extractedText += `処理日時: ${new Date().toLocaleString('ja-JP')}\n`
            extractedText += `解析方法: OpenAI GPT-4 Vision`
            
            return NextResponse.json({ 
              success: true,
              text: extractedText,
              fileName: fileName,
              analyzedBy: 'openai'
            })
          }
        } else {
          const errorText = await openaiResponse.text()
          console.error('OpenAI API error response:', openaiResponse.status, errorText)
          try {
            const errorData = JSON.parse(errorText)
            console.error('Error details:', errorData)
          } catch {
            console.error('Error text:', errorText)
          }
        }
        
        console.log('OpenAI analysis failed, trying Grok...')
      } catch (openaiError) {
        console.error('OpenAI API error:', openaiError)
        console.error('Error details:', openaiError instanceof Error ? openaiError.message : String(openaiError))
      }
    }
    
    // OpenAIが失敗した場合はGrokを試す
    if (grokApiKey) {
      try {
        console.log('Sending PDF to Grok for analysis...')
        
        // GrokにPDFの内容を解析してもらう
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
                content: 'あなたはドキュメントの内容を理解し、構造化されたテキストとして整理する専門家です。与えられた情報から、章立てや重要なポイントを明確に整理して日本語で出力してください。'
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `以下のPDFファイルの内容を分析して、構造化された要約を作成してください。\n\nファイル名: ${fileName}\n${userPrompt ? `\nユーザーからの追加情報:\n${userPrompt}\n` : ''}\n指示: PDFの内容を詳細に分析し、主要なトピック、章立て、重要なポイントを整理して、日本語で構造化された要約を作成してください。`
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: content // PDFのbase64データを直接送信
                    }
                  }
                ]
              }
            ],
            model: 'grok-2-latest',
            stream: false,
            temperature: 0.3,
            max_tokens: 2000
          })
        })

        if (grokResponse.ok) {
          const grokData = await grokResponse.json()
          
          if (grokData.choices && grokData.choices[0] && grokData.choices[0].message) {
            const extractedContent = grokData.choices[0].message.content
            console.log('Grok successfully analyzed PDF')
            
            // コンテンツにメタ情報を追加
            extractedText = `PDFファイル: ${fileName}\n\n`
            extractedText += `=== Grok AIによるPDF内容解析 ===\n\n`
            extractedText += extractedContent
            extractedText += `\n\n=== ファイル情報 ===\n`
            extractedText += `ファイル名: ${fileName}\n`
            extractedText += `ファイルサイズ: ${Math.round(base64Data.length * 0.75 / 1024)}KB\n`
            extractedText += `処理日時: ${new Date().toLocaleString('ja-JP')}\n`
            extractedText += `解析方法: Grok AI PDF直接解析`
            
            return NextResponse.json({ 
              success: true,
              text: extractedText,
              fileName: fileName,
              analyzedBy: 'grok'
            })
          }
        }
        
        console.log('Grok analysis failed, falling back to default processing')
      } catch (grokError) {
        console.error('Grok API error:', grokError)
      }
    }
    
    // APIが利用できない場合
    console.error('Both OpenAI and Grok APIs failed or not configured')
    
    return NextResponse.json({ 
      success: false,
      error: 'PDF processing failed. Both OpenAI and Grok APIs are not available.',
      fileName: fileName
    }, { status: 500 })
  } catch (error) {
    console.error('PDF processing error:', error)
    console.error('Error details:', error instanceof Error ? error.stack : error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process PDF',
        details: error instanceof Error ? error.message : 'Unknown error',
        hint: 'PDFファイルが大きすぎる可能性があります。または、API設定を確認してください。'
      },
      { status: 500 }
    )
  }
}