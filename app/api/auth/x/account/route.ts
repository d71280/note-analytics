import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('x_session')?.value
  
  if (!sessionToken) {
    return NextResponse.json({ account: null })
  }

  try {
    const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET!) as {
      userId: string
      username: string
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('x_accounts')
      .select('user_id, username, name, connected_at')
      .eq('user_id', decoded.userId)
      .single()

    if (error || !data) {
      return NextResponse.json({ account: null })
    }

    return NextResponse.json({ account: data })
  } catch (error) {
    console.error('Session verification error:', error)
    return NextResponse.json({ account: null })
  }
}