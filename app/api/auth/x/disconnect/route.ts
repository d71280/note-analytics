import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import jwt from 'jsonwebtoken'

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

    const supabase = createClient()
    const { error } = await supabase
      .from('x_accounts')
      .delete()
      .eq('user_id', decoded.userId)

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json(
        { error: 'Failed to disconnect' },
        { status: 500 }
      )
    }

    const response = NextResponse.json({ success: true })
    response.cookies.delete('x_session')
    
    return response
  } catch (error) {
    console.error('Disconnect error:', error)
    return NextResponse.json(
      { error: 'Invalid session' },
      { status: 401 }
    )
  }
}