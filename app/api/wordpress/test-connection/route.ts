import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { url, username, password } = await request.json()
    
    if (!url || !username || !password) {
      return NextResponse.json(
        { error: '必要な情報が不足しています' },
        { status: 400 }
      )
    }
    
    // Basic認証用のBase64エンコード
    const credentials = Buffer.from(`${username}:${password}`).toString('base64')
    
    // WordPress REST APIのusersエンドポイントで接続テスト
    const testResponse = await fetch(`${url}/wp-json/wp/v2/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`
      }
    })
    
    if (testResponse.ok) {
      const userData = await testResponse.json()
      return NextResponse.json({
        success: true,
        message: `接続成功！ユーザー: ${userData.name}`,
        user: userData.name
      })
    } else {
      const errorText = await testResponse.text()
      console.error('WordPress connection test failed:', errorText)
      
      if (testResponse.status === 401) {
        return NextResponse.json(
          { error: '認証に失敗しました。ユーザー名とパスワードを確認してください' },
          { status: 401 }
        )
      } else if (testResponse.status === 404) {
        return NextResponse.json(
          { error: 'WordPress REST APIが見つかりません。URLを確認してください' },
          { status: 404 }
        )
      } else {
        return NextResponse.json(
          { error: `接続に失敗しました (${testResponse.status})` },
          { status: testResponse.status }
        )
      }
    }
  } catch (error) {
    console.error('WordPress connection test error:', error)
    
    if (error instanceof Error && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'サイトに接続できません。URLを確認してください' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: '接続テストに失敗しました' },
      { status: 500 }
    )
  }
}