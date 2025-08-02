import { NextResponse } from 'next/server'

const TWITTER_AUTH_URL = 'https://twitter.com/i/oauth2/authorize'

export async function GET() {
  const clientId = process.env.X_CLIENT_ID
  const redirectUri = process.env.X_REDIRECT_URI
  
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'X API設定が不完全です' },
      { status: 500 }
    )
  }

  const state = Math.random().toString(36).substring(7)
  const codeChallenge = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'tweet.read tweet.write users.read offline.access',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'plain'
  })

  const authUrl = `${TWITTER_AUTH_URL}?${params.toString()}`
  
  const response = NextResponse.json({ authUrl })
  
  response.cookies.set('x_auth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10
  })
  
  response.cookies.set('x_code_challenge', codeChallenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10
  })

  return response
}