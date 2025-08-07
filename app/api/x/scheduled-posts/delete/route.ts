import { NextRequest, NextResponse } from 'next/server'
import { deleteScheduledPost } from '@/lib/utils/scheduled-posts'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    console.log('Delete request received for ID:', id)
    
    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    const success = await deleteScheduledPost(id)
    
    if (success) {
      return NextResponse.json({ 
        success: true,
        message: 'Post deleted successfully',
        deleted: [{ id }]
      })
    } else {
      return NextResponse.json(
        { 
          error: 'Failed to delete post',
          suggestion: 'Post may not exist or database permission issues'
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Delete scheduled post error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// 複数削除用
export async function POST(request: NextRequest) {
  try {
    const { ids, status } = await request.json()
    
    if (status && !ids) {
      // Delete by status
      const { deletePostsByStatus } = await import('@/lib/utils/scheduled-posts')
      const result = await deletePostsByStatus(status)
      
      return NextResponse.json({ 
        success: result.success,
        deleted: result.deleted,
        message: `Deleted ${result.deleted} posts with status: ${status}`
      })
    }
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Post IDs are required' },
        { status: 400 }
      )
    }

    // Delete individual posts
    let deletedCount = 0
    const errors = []

    for (const id of ids) {
      try {
        const success = await deleteScheduledPost(id)
        if (success) {
          deletedCount++
        } else {
          errors.push({ id, error: 'Failed to delete' })
        }
      } catch (error) {
        errors.push({ 
          id, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    return NextResponse.json({ 
      success: deletedCount > 0,
      deleted: deletedCount,
      failed: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Delete scheduled posts error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}