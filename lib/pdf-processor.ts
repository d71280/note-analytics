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
  // 動的インポートでクライアントサイドのみで実行
  const pdfjsLib = await import('pdfjs-dist')
  
  // ワーカーの設定
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`
  
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  
  let fullText = ''
  
  // 全ページからテキストを抽出
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    
    const pageText = textContent.items
      .map((item) => (item as PDFTextItem).str)
      .join(' ')
    
    fullText += `\n=== ページ ${i} ===\n${pageText}\n`
  }
  
  return fullText
}