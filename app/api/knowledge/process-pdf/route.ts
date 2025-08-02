import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { content, fileName } = await request.json()

    if (!content || !fileName) {
      return NextResponse.json(
        { error: 'Content and fileName are required' },
        { status: 400 }
      )
    }

    // PDFのbase64データを処理
    // base64プレフィックスを除去
    const base64Data = content.replace(/^data:application\/pdf;base64,/, '')
    
    // PDFの内容をテキストとして扱う
    // 実際のPDF解析は、クライアントサイドで行うか、
    // より高度な処理が必要な場合は外部サービスを使用
    let extractedText = `PDFファイル: ${fileName}\n\n`
    
    // PDFファイルの場合、メタ情報として保存
    extractedText += `[このPDFファイルは知識ベースに保存されました。内容の詳細な解析は、適切なPDF処理ツールを使用してください。]\n\n`
    extractedText += `ファイルサイズ: ${Math.round(base64Data.length * 0.75 / 1024)}KB\n`
    extractedText += `保存日時: ${new Date().toLocaleString('ja-JP')}`

    return NextResponse.json({ 
      success: true,
      text: extractedText,
      fileName: fileName
    })
  } catch (error) {
    console.error('PDF processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process PDF' },
      { status: 500 }
    )
  }
}