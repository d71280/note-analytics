import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import jwt from 'jsonwebtoken'
import { createClient } from '@/lib/supabase/server'

const TOKEN_URL = 'https://api.twitter.com/2/oauth2/token'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  
  const storedState = request.cookies.get('x_auth_state')?.value
  const codeChallenge = request.cookies.get('x_code_challenge')?.value
  
  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(new URL('/settings?error=invalid_request', request.url))
  }

  try {
    const tokenResponse = await axios.post(TOKEN_URL, new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: process.env.X_CLIENT_ID!,
      redirect_uri: process.env.X_REDIRECT_URI!,
      code_verifier: codeChallenge!
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`).toString('base64')}`
      }
    })

    const { access_token, refresh_token } = tokenResponse.data

    const userResponse = await axios.get('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    })

    const userData = userResponse.data.data

    const supabase = createClient()
    
    const { error } = await supabase
      .from('x_accounts')
      .upsert({
        user_id: userData.id,
        username: userData.username,
        name: userData.name,
        access_token: access_token,
        refresh_token: refresh_token,
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.redirect(new URL('/settings?error=database_error', request.url))
    }

    const sessionToken = jwt.sign(
      { 
        userId: userData.id,
        username: userData.username
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    const response = NextResponse.redirect(new URL('/settings?success=x_connected', request.url))
    
    response.cookies.set('x_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    })
    
    response.cookies.delete('x_auth_state')
    response.cookies.delete('x_code_challenge')

    return response
  } catch (error) {
    console.error('X OAuth error:', error)
    return NextResponse.redirect(new URL('/settings?error=auth_failed', request.url))
  }
}