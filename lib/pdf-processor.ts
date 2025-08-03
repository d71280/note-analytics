// クライアントサイドでのPDF処理
interface PDFTextItem {
  str: string
  dir?: string
  width?: number
  height?: number
  transform?: number[]
  fontName?: string
}

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log('[PDF-Processor] 開始:', file.name)
    
    // 動的インポートでクライアントサイドのみで実行
    const pdfjsLib = await import('pdfjs-dist')
    console.log('[PDF-Processor] pdfjs-dist読み込み完了')
    
    // ワーカーの設定（publicディレクトリのワーカーファイルを使用）
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.js/pdf.worker.min.js'
    console.log('[PDF-Processor] ワーカー設定完了')
    
    const arrayBuffer = await file.arrayBuffer()
    console.log('[PDF-Processor] ArrayBuffer変換完了:', arrayBuffer.byteLength, 'bytes')
    
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    console.log('[PDF-Processor] PDFドキュメント読み込み完了. ページ数:', pdf.numPages)
    
    let fullText = ''
    
    // 全ページからテキストを抽出
    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`[PDF-Processor] ページ${i}を処理中...`)
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    
    const pageText = textContent.items
      .map((item) => (item as PDFTextItem).str)
      .join(' ')
    
    fullText += `\n=== ページ ${i} ===\n${pageText}\n`
    console.log(`[PDF-Processor] ページ${i}のテキスト長:`, pageText.length)
  }
  
  console.log('[PDF-Processor] 全テキスト抽出完了. 総文字数:', fullText.length)
  return fullText
  } catch (error) {
    console.error('[PDF-Processor] エラー発生:', error)
    throw error
  }
}