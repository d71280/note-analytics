import { NextRequest, NextResponse } from 'next/server'

// X API無料プランの制限回避のためのモックデータ
export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    // モックツイートデータ
    const mockTweets = [
      {
        id: "1234567890123456789",
        text: `${query}に関する興味深いツイートです。noteの新機能について詳しく解説しています。 #note #${query}`,
        created_at: new Date().toISOString(),
        author: {
          id: "987654321",
          name: "テストユーザー",
          username: "test_user",
          profile_image_url: "https://via.placeholder.com/40"
        },
        metrics: {
          like_count: Math.floor(Math.random() * 100) + 10,
          retweet_count: Math.floor(Math.random() * 50) + 5,
          reply_count: Math.floor(Math.random() * 20) + 2,
          quote_count: Math.floor(Math.random() * 10) + 1
        },
        url: "https://twitter.com/test_user/status/1234567890123456789"
      }
    ]

    return NextResponse.json({
      success: true,
      query: query,
      count: mockTweets.length,
      tweets: mockTweets,
      mock: true,
      message: "X API無料プランの制限により、モックデータを表示しています。"
    })
  } catch (error) {
    console.error('Mock search error:', error)
    return NextResponse.json(
      { error: 'Failed to search tweets' },
      { status: 500 }
    )
  }
}