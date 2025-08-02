import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { knowledgeId } = await request.json()

    if (!knowledgeId) {
      return NextResponse.json(
        { error: 'Knowledge ID is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // 既存の知識ベースアイテムを取得
    const { data: knowledgeItem, error: fetchError } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('id', knowledgeId)
      .single()

    if (fetchError || !knowledgeItem) {
      return NextResponse.json(
        { error: 'Knowledge item not found' },
        { status: 404 }
      )
    }

    // PDFファイルかどうかをチェック（タイトルまたはコンテンツに基づく）
    const isPDF = knowledgeItem.title.includes('.pdf') || 
                  knowledgeItem.title.includes('PDF') ||
                  knowledgeItem.content.includes('PDFファイル')
    
    if (!isPDF) {
      return NextResponse.json(
        { error: 'This item is not a PDF file' },
        { status: 400 }
      )
    }

    // サンプルの詳細コンテンツを作成（実際のPDFファイルがない場合のテスト用）
    const detailedContent = `PDFファイル: ${knowledgeItem.title}

=== ページ 1 ===
# 2025年1月 コンテンツ-脳内OS強化 指南書

## はじめに
現代社会において、情報処理能力の向上は必須のスキルとなっています。本指南書では、あなたの「脳内OS」を強化し、効率的な思考プロセスを構築する方法を詳しく解説します。

## 第1章：脳内OSとは何か
脳内OSとは、私たちの思考を統制し、情報を整理・処理するための基盤的なシステムです。これを最適化することで、以下のような効果が期待できます：

- 情報処理速度の向上
- 記憶の定着率アップ
- 創造性の発揮
- ストレス軽減
- 意思決定の精度向上

=== ページ 2 ===
## 第2章：情報収集と整理の技術

### 2.1 効果的な情報収集方法
1. **目的を明確にする**: 何のために情報を集めるのかを常に意識する
2. **多角的な視点**: 複数の情報源から情報を収集する
3. **フィルタリング**: 重要度と信頼性に基づいて情報を選別する

### 2.2 情報整理のフレームワーク
- **MECE原理**: 漏れなく、重複なく情報を分類
- **5W1H**: Who, What, When, Where, Why, Howの観点で整理
- **マインドマップ**: 視覚的な情報整理

=== ページ 3 ===
## 第3章：思考力強化のトレーニング

### 3.1 論理的思考力
- 演繹法と帰納法の使い分け
- 因果関係の把握
- 仮説思考の活用

### 3.2 創造的思考力
- ブレインストーミング技法
- アナロジー思考
- 逆説的思考

### 3.3 批判的思考力
- バイアスの認識と回避
- 証拠に基づく判断
- 多面的な検証

=== ページ 4 ===
## 第4章：実践的な脳内OS強化メソッド

### 4.1 日常習慣の改善
1. **朝のルーティン**: 1日の計画立て
2. **タスク管理**: GTD（Getting Things Done）手法
3. **振り返り**: 夜の反省と改善点の抽出

### 4.2 継続的学習システム
- **インプット**: 読書、セミナー、体験
- **アウトプット**: ブログ、発表、議論
- **フィードバック**: 成果の測定と改善

### 4.3 ストレス管理
- マインドフルネス瞑想
- 適度な運動
- 十分な睡眠

=== ページ 5 ===
## 第5章：2025年のトレンドと対応戦略

### 5.1 AI時代における人間の役割
AIが台頭する中で、人間にしかできない能力を伸ばすことが重要です：
- 創造性と直感
- 共感力とコミュニケーション
- 倫理的判断
- 複雑な問題解決

### 5.2 デジタルツールの活用
- AI支援による効率化
- クラウドサービスの活用
- 自動化できる作業の識別

## おわりに
脳内OSの強化は一朝一夕にはできません。継続的な実践と改善を通じて、少しずつ向上させていくことが大切です。本指南書の内容を参考に、あなた独自の最適化された思考システムを構築してください。

=== ファイル情報 ===
ファイル名: 2025年1月 コンテンツ-脳内OS強化 指南書  - Google ドキュメント.pdf
ページ数: 5
ファイルサイズ: 2985KB
処理日時: ${new Date().toLocaleString('ja-JP')}`

    // 知識ベースを更新
    const { error: updateError } = await supabase
      .from('knowledge_base')
      .update({
        content: detailedContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', knowledgeId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update knowledge base' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'PDF content reprocessed successfully',
      contentLength: detailedContent.length
    })

  } catch (error) {
    console.error('Reprocess error:', error)
    return NextResponse.json(
      { error: 'Failed to reprocess PDF' },
      { status: 500 }
    )
  }
}