import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Note.com 公式API v2を使用した投稿
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, title, platform, postId, format = 'markdown' } = body

    if (platform !== 'note') {
      return NextResponse.json(
        { error: 'This endpoint is for note only' },
        { status: 400 }
      )
    }

    // 環境変数からAPIキーを取得
    const noteApiKey = process.env.NOTE_API_KEY
    const noteUserId = process.env.NOTE_USER_ID

    if (!noteApiKey) {
      console.error('Note API key not configured')
      return NextResponse.json(
        { error: 'Note API key not configured. Please set NOTE_API_KEY in environment variables.' },
        { status: 500 }
      )
    }

    // マークダウンからHTMLへの変換（必要に応じて）
    const processedContent = format === 'markdown' ? convertMarkdownToHtml(content) : convertToHtml(content)

    // Note API v2エンドポイント
    const apiUrl = noteUserId 
      ? `https://note.com/api/v2/creators/${noteUserId}/contents`
      : 'https://note.com/api/v2/notes'

    // 記事データの準備
    const postData = {
      kind: 'text', // テキスト記事
      name: title || 'Untitled',
      body: processedContent,
      status: 'published', // または 'draft'
      hashtags: [], // ハッシュタグ（オプション）
      price: 0, // 有料記事の場合は価格を設定
      limited: false, // 限定公開
      is_refund: false,
      disableComment: false,
      disableLike: false
    }

    // Note APIへの投稿リクエスト
    const postResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${noteApiKey}`,
        'X-NOTE-API-Version': '2.0.0'
      },
      body: JSON.stringify(postData)
    })

    if (!postResponse.ok) {
      const errorText = await postResponse.text()
      console.error('Note API error:', {
        status: postResponse.status,
        error: errorText
      })
      
      // 認証エラーの場合
      if (postResponse.status === 401) {
        return NextResponse.json(
          { 
            error: 'Authentication failed. Please check your Note API key.',
            details: 'Make sure NOTE_API_KEY is correctly set in environment variables.'
          },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to post to Note',
          details: errorText,
          status: postResponse.status
        },
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
          status: 'posted',
          posted_at: new Date().toISOString(),
          metadata: {
            note_post_id: notePost.data?.id,
            note_url: notePost.data?.noteUrl || notePost.data?.url
          }
        })
        .eq('id', postId)
    }

    return NextResponse.json({
      success: true,
      postId: notePost.data?.id,
      url: notePost.data?.noteUrl || notePost.data?.url,
      message: 'Successfully posted to Note'
    })

  } catch (error) {
    console.error('Note post error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to post to Note', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// マークダウンをHTMLに変換する関数
function convertMarkdownToHtml(markdown: string): string {
  let html = markdown
    // 見出し
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // 太字
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    // イタリック
    .replace(/\*([^\*]+?)\*/g, '<em>$1</em>')
    .replace(/_([^_]+?)_/g, '<em>$1</em>')
    // コードブロック
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // リスト
    .replace(/^\* (.+)/gim, '<li>$1</li>')
    .replace(/^- (.+)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.+)/gim, '<li>$1</li>')
    // 引用
    .replace(/^> (.+)/gim, '<blockquote>$1</blockquote>')
    // 水平線
    .replace(/^---$/gim, '<hr>')
    .replace(/^\*\*\*$/gim, '<hr>')
    // リンク
    .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>')
    // 改行
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
  
  // リストタグの整形
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
  
  // 段落タグで囲む
  if (!html.startsWith('<')) {
    html = `<p>${html}</p>`
  }
  
  return html
}

// プレーンテキストをHTML形式に変換
function convertToHtml(text: string): string {
  const htmlText = text
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
  
  return `<p>${htmlText}</p>`
}

// Note APIの接続テスト
export async function GET() {
  const noteApiKey = process.env.NOTE_API_KEY
  const noteUserId = process.env.NOTE_USER_ID

  if (!noteApiKey) {
    return NextResponse.json({
      configured: false,
      message: 'Note API key not configured',
      help: 'Please set NOTE_API_KEY in environment variables'
    })
  }

  try {
    // APIキーの検証（ユーザー情報の取得を試みる）
    const response = await fetch('https://note.com/api/v2/user', {
      headers: {
        'Authorization': `Bearer ${noteApiKey}`,
        'X-NOTE-API-Version': '2.0.0'
      }
    })

    if (response.ok) {
      const userData = await response.json()
      return NextResponse.json({
        configured: true,
        message: 'Note API is properly configured',
        user: userData.data?.name || 'Unknown',
        userId: noteUserId || userData.data?.id
      })
    } else {
      return NextResponse.json({
        configured: true,
        valid: false,
        message: 'Note API key is set but invalid',
        status: response.status
      })
    }
  } catch (error) {
    return NextResponse.json({
      configured: true,
      valid: false,
      message: 'Failed to validate Note API key',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}