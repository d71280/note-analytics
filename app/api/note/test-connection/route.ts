import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: '必要な情報が不足しています' },
        { status: 400 }
      )
    }
    
    // noteのログインエンドポイントでテスト（非公式）
    const loginResponse = await fetch('https://note.com/api/v1/sessions/sign_in', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        login: email,
        password: password
      })
    })
    
    if (loginResponse.ok) {
      const userData = await loginResponse.json()
      return NextResponse.json({
        success: true,
        message: `接続成功！ユーザー: ${userData.data?.user?.name || email}`
      })
    } else {
      const errorData = await loginResponse.json().catch(() => null)
      console.error('note connection test failed:', errorData)
      
      if (loginResponse.status === 401 || loginResponse.status === 422) {
        return NextResponse.json(
          { error: '認証に失敗しました。メールアドレスとパスワードを確認してください' },
          { status: 401 }
        )
      } else {
        return NextResponse.json(
          { error: `接続に失敗しました (${loginResponse.status})` },
          { status: loginResponse.status }
        )
      }
    }
  } catch (error) {
    console.error('note connection test error:', error)
    
    return NextResponse.json(
      { error: '接続テストに失敗しました。noteは非公式APIのため、仕様変更により動作しない可能性があります' },
      { status: 500 }
    )
  }
}