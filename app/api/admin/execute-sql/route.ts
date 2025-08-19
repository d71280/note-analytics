import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { sql } = await request.json()

    if (!sql) {
      return NextResponse.json(
        { error: 'SQL query is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // SQLを実行
    const { data, error } = await supabase.rpc('execute_sql', { query: sql })

    if (error) {
      console.error('SQL execution error:', error)
      return NextResponse.json(
        { error: `SQL execution failed: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'SQL executed successfully'
    })
  } catch (error) {
    console.error('Execute SQL error:', error)
    return NextResponse.json(
      { error: `Failed to execute SQL: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}