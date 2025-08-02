import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { query, limit = 5 } = await request.json()

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // 知識ベースから関連するコンテンツを検索
    // タイトル、コンテンツ、タグから検索
    const { data: searchResults, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json(
        { error: 'Search failed' },
        { status: 500 }
      )
    }

    // 検索結果を関連度でスコアリング（簡易版）
    const scoredResults = searchResults.map(item => {
      let score = 0
      const lowerQuery = query.toLowerCase()
      const lowerTitle = item.title.toLowerCase()
      const lowerContent = item.content.toLowerCase()

      // タイトルに含まれる場合は高スコア
      if (lowerTitle.includes(lowerQuery)) {
        score += 10
      }

      // コンテンツに含まれる回数でスコア加算
      const contentMatches = (lowerContent.match(new RegExp(lowerQuery, 'g')) || []).length
      score += contentMatches

      // タグに含まれる場合もスコア加算
      if (item.tags && item.tags.some((tag: string) => tag.toLowerCase().includes(lowerQuery))) {
        score += 5
      }

      return { ...item, relevanceScore: score }
    })

    // スコアの高い順にソート
    const sortedResults = scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore)

    return NextResponse.json({
      success: true,
      results: sortedResults,
      query: query,
      totalResults: sortedResults.length
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}