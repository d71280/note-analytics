import { NextRequest, NextResponse } from 'next/server'
import { deleteAllScheduledPosts } from '@/lib/utils/scheduled-posts'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const confirm = searchParams.get('confirm')
    
    if (confirm !== 'true') {
      return NextResponse.json(
        { error: 'Confirmation required. Add ?confirm=true to delete all posts.' },
        { status: 400 }
      )
    }

    console.log('Starting delete all operation...')
    
    const result = await deleteAllScheduledPosts()
    
    console.log('Delete all result:', result)
    
    if (!result.success && result.deleted === 0) {
      return NextResponse.json(
        { 
          error: 'Failed to delete posts',
          details: result.errors
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: result.deleted === 0 ? 'No posts to delete' : `Successfully deleted ${result.deleted} posts`,
      deleted: result.deleted,
      failed: result.errors
    })
  } catch (error) {
    console.error('Delete all posts error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}