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
    
    console.log('WordPress connection test:', { url, username: username.substring(0, 5) + '...' })
    
    // Basic認証用のBase64エンコード  
    const credentials = Buffer.from(`${username}:${password}`).toString('base64')
    
    // WordPress REST APIのusersエンドポイントで接続テスト
    // まずpostsエンドポイントで接続確認
    const testUrl = `${url}/wp-json/wp/v2/posts?per_page=1`
    const testResponse = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Note-Analytics-Platform/1.0'
      }
    })
    
    if (testResponse.ok) {
      // 接続成功、さらにusers/meでユーザー情報を取得
      const userResponse = await fetch(`${url}/wp-json/wp/v2/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (userResponse.ok) {
        const userData = await userResponse.json()
        return NextResponse.json({
          success: true,
          message: `接続成功！ユーザー: ${userData.name}`,
          user: userData.name
        })
      } else {
        // postsは取得できるがusers/meが取得できない場合
        return NextResponse.json({
          success: true,
          message: 'WordPress APIに接続できました',
          note: '認証は成功しましたが、ユーザー情報の取得に制限があります'
        })
      }
    } else if (testResponse.status === 403) {
      // 403の場合、アプリケーションパスワードの問題かもしれない
      return NextResponse.json(
        { 
          error: '認証に失敗しました。アプリケーションパスワードを使用しているか確認してください',
          help: 'WordPress管理画面 → ユーザー → プロフィール → アプリケーションパスワードで生成したパスワードを使用してください'
        },
        { status: 403 }
      )
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