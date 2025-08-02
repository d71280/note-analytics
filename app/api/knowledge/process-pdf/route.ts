import { NextRequest, NextResponse } from 'next/server'
import * as pdfjs from 'pdfjs-dist'

// PDF.jsワーカーの設定
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
}

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
    const base64Data = content.replace(/^data:application\/pdf;base64,/, '')
    
    try {
      // Base64をバイナリデータに変換
      const binaryData = Buffer.from(base64Data, 'base64')
      
      // PDF.jsでPDFを読み込み
      const loadingTask = pdfjs.getDocument({
        data: binaryData,
        useSystemFonts: true,
      })
      
      const pdf = await loadingTask.promise
      let extractedText = `PDFファイル: ${fileName}\n\n`
      
      console.log(`PDF loaded. Pages: ${pdf.numPages}`)
      
      // 各ページからテキストを抽出
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum)
          const textContent = await page.getTextContent()
          
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ')
            .trim()
          
          if (pageText) {
            extractedText += `\n=== ページ ${pageNum} ===\n${pageText}\n`
          }
        } catch (pageError) {
          console.error(`Error processing page ${pageNum}:`, pageError)
          extractedText += `\n=== ページ ${pageNum} ===\n[ページの読み込みに失敗しました]\n`
        }
      }
      
      // メタ情報を追加
      extractedText += `\n\n=== ファイル情報 ===\n`
      extractedText += `ファイル名: ${fileName}\n`
      extractedText += `ページ数: ${pdf.numPages}\n`
      extractedText += `ファイルサイズ: ${Math.round(base64Data.length * 0.75 / 1024)}KB\n`
      extractedText += `処理日時: ${new Date().toLocaleString('ja-JP')}`
      
      console.log(`PDF processing completed. Extracted text length: ${extractedText.length}`)
      
      return NextResponse.json({ 
        success: true,
        text: extractedText,
        fileName: fileName,
        pages: pdf.numPages
      })
      
    } catch (pdfError) {
      console.error('PDF parsing error:', pdfError)
      
      // PDFパースに失敗した場合はフォールバック
      let fallbackText = `PDFファイル: ${fileName}\n\n`
      fallbackText += `[PDF解析中にエラーが発生しました。ファイルが破損しているか、サポートされていない形式の可能性があります。]\n\n`
      fallbackText += `エラー詳細: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}\n`
      fallbackText += `ファイルサイズ: ${Math.round(base64Data.length * 0.75 / 1024)}KB\n`
      fallbackText += `処理日時: ${new Date().toLocaleString('ja-JP')}`
      
      return NextResponse.json({ 
        success: true,
        text: fallbackText,
        fileName: fileName,
        warning: 'PDF parsing failed, saved metadata only'
      })
    }
  } catch (error) {
    console.error('PDF processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process PDF' },
      { status: 500 }
    )
  }
}