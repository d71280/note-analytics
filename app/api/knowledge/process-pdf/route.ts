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
    
    // ファイルサイズチェック（5MB制限）
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (content.length > maxSize) {
      return NextResponse.json(
        { 
          error: 'PDFファイルが大きすぎます',
          details: `ファイルサイズ: ${Math.round(content.length / 1024 / 1024)}MB`,
          hint: '5MB以下のPDFファイルをアップロードしてください。大きなPDFは分割するか、テキストのみを抽出してください。'
        },
        { status: 400 }
      )
    }

    // 環境変数の確認（デバッグ用）
    console.log('Environment check:', {
      hasGrok: !!process.env.GROK_API_KEY
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
    
    // APIキーを確認
    const grokApiKey = process.env.GROK_API_KEY
    
    // Grok APIを使用
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
            let extractedText = `PDFファイル: ${fileName}\n\n`
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
    console.error('Grok API not configured')
    
    return NextResponse.json({ 
      success: false,
      error: 'PDF processing failed. Grok API is not configured.',
      fileName: fileName
    }, { status: 500 })
  } catch (error) {
    console.error('PDF processing error:', error)
    console.error('Error details:', error instanceof Error ? error.stack : error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process PDF',
        details: error instanceof Error ? error.message : 'Unknown error',
        hint: 'PDFファイルが大きすぎる可能性があります。または、Grok API設定を確認してください。'
      },
      { status: 500 }
    )
  }
}