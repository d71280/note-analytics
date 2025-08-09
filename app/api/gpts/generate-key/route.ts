import { NextResponse } from 'next/server'
import crypto from 'crypto'

// 簡易的なAPIキー生成（環境変数不要）
export async function GET() {
  // ランダムなAPIキーを生成
  const apiKey = `gpts_${crypto.randomBytes(32).toString('hex')}`
  
  // 環境変数に設定する手順を含めて返す
  return NextResponse.json({
    apiKey,
    instructions: {
      step1: 'このAPIキーをコピーしてください',
      step2: 'GPTsの設定画面の「API キー」欄に貼り付けてください',
      step3: 'Vercelの環境変数にGPTS_API_KEYとして設定してください',
      vercelUrl: 'https://vercel.com/your-project/settings/environment-variables'
    },
    note: '重要: このキーは一度しか表示されません。必ずコピーして保存してください。'
  })
}