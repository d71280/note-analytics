import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// note.com非公式API実装
// 警告: これは非公式APIを使用しています。仕様変更により動作しなくなる可能性があります。

interface NotePostData {
  name: string // タイトル
  body: string // 本文（HTML形式）
  status: 'published' | 'draft'
}

// noteへの投稿作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, title, platform, postId } = body

    if (platform !== 'note') {
      return NextResponse.json(
        { error: 'This endpoint is for note only' },
        { status: 400 }
      )
    }

    // 環境変数から認証情報を取得
    const noteEmail = process.env.NOTE_LOGIN_MAILADRESS || process.env.NOTE_EMAIL || ''
    const notePassword = process.env.NOTE_LOGIN_PASSWORD || process.env.NOTE_PASSWORD || ''

    if (!noteEmail || !notePassword) {
      console.error('Note credentials not configured:', {
        emailExists: !!noteEmail,
        passwordExists: !!notePassword,
        envVars: Object.keys(process.env).filter(key => key.includes('NOTE'))
      })
      return NextResponse.json(
        { error: 'note credentials not configured' },
        { status: 500 }
      )
    }

    // Step 1: ログインしてセッションを取得
    const loginResponse = await fetch('https://note.com/api/v1/sessions/sign_in', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({
        login: noteEmail,
        password: notePassword
      })
    })

    if (!loginResponse.ok) {
      console.error('note login failed:', await loginResponse.text())
      return NextResponse.json(
        { error: 'Failed to login to note' },
        { status: 401 }
      )
    }

    // クッキーからセッショントークンを取得
    const cookies = loginResponse.headers.get('set-cookie')
    const sessionToken = extractSessionToken(cookies)

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Failed to get note session' },
        { status: 401 }
      )
    }

    // Step 2: 記事を投稿
    const postData: NotePostData = {
      name: title || 'Untitled',
      body: convertToHtml(content),
      status: 'published' // または 'draft' で下書き
    }

    const postResponse = await fetch('https://note.com/api/v2/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionToken,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        note: postData
      })
    })

    if (!postResponse.ok) {
      const error = await postResponse.text()
      console.error('note post failed:', error)
      return NextResponse.json(
        { error: 'Failed to post to note', details: error },
        { status: postResponse.status }
      )
    }

    const notePost = await postResponse.json()

    // 投稿成功後、ステータスを更新
    if (postId) {
      const supabase = createAdminClient()
      await supabase
        .from('scheduled_posts')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString(),
          note_post_id: notePost.id,
          note_url: `https://note.com/muchinochikaigi/n/${notePost.key}`
        })
        .eq('id', postId)
    }

    return NextResponse.json({
      success: true,
      postId: notePost.id,
      url: `https://note.com/muchinochikaigi/n/${notePost.key}`,
      message: 'Successfully posted to note'
    })

  } catch (error) {
    console.error('note post error:', error)
    return NextResponse.json(
      { error: 'Failed to post to note', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// セッショントークンを抽出するヘルパー関数
function extractSessionToken(cookies: string | null): string {
  if (!cookies) return ''
  
  const sessionCookie = cookies.split(';').find(c => c.includes('_note_session'))
  if (!sessionCookie) return ''
  
  return sessionCookie.trim()
}

// プレーンテキストをHTML形式に変換
function convertToHtml(text: string): string {
  // 改行を<br>タグに変換
  const htmlText = text
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
  
  return `<p>${htmlText}</p>`
}

// note記事の更新
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { noteId, content, title } = body

    // ログイン処理（上記と同様）
    const noteEmail = process.env.NOTE_EMAIL || ''
    const notePassword = process.env.NOTE_PASSWORD || ''

    const loginResponse = await fetch('https://note.com/api/v1/sessions/sign_in', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify({
        login: noteEmail,
        password: notePassword
      })
    })

    const cookies = loginResponse.headers.get('set-cookie')
    const sessionToken = extractSessionToken(cookies)

    // 記事を更新
    const updateResponse = await fetch(`https://note.com/api/v2/notes/${noteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionToken,
        'User-Agent': 'Mozilla/5.0',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        note: {
          name: title,
          body: convertToHtml(content),
          status: 'published'
        }
      })
    })

    if (!updateResponse.ok) {
      const error = await updateResponse.text()
      return NextResponse.json(
        { error: 'Failed to update note post', details: error },
        { status: updateResponse.status }
      )
    }

    const notePost = await updateResponse.json()

    return NextResponse.json({
      success: true,
      postId: notePost.id,
      url: `https://note.com/muchinochikaigi/n/${notePost.key}`,
      message: 'Successfully updated note post'
    })

  } catch (error) {
    console.error('note update error:', error)
    return NextResponse.json(
      { error: 'Failed to update note post' },
      { status: 500 }
    )
  }
}