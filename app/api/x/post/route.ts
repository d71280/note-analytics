import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import axios from 'axios'
import jwt from 'jsonwebtoken'

const TWITTER_API_URL = 'https://api.twitter.com/2/tweets'

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get('x_session')?.value
  
  if (!sessionToken) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET!) as {
      userId: string
      username: string
    }

    const { text, postType } = await request.json()

    if (!text || text.length > 280) {
      return NextResponse.json(
        { error: 'Invalid tweet text' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    const { data: account, error: fetchError } = await supabase
      .from('x_accounts')
      .select('access_token, refresh_token')
      .eq('user_id', decoded.userId)
      .single()

    if (fetchError || !account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    const tweetResponse = await axios.post(
      TWITTER_API_URL,
      { text },
      {
        headers: {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const { data: { id: tweetId } } = tweetResponse

    await supabase
      .from('x_post_history')
      .insert({
        x_account_id: decoded.userId,
        post_type: postType || 'manual',
        post_content: text,
        tweet_id: tweetId,
        status: 'success'
      })

    return NextResponse.json({ 
      success: true, 
      tweetId,
      url: `https://twitter.com/${decoded.username}/status/${tweetId}`
    })
  } catch (error) {
    console.error('Tweet error:', error)
    
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return NextResponse.json(
        { error: 'Token expired. Please reconnect your account.' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to post tweet' },
      { status: 500 }
    )
  }
}