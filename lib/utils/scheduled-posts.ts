import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface ScheduledPost {
  id: string
  content: string
  platform: 'x' | 'note' | 'wordpress'
  scheduled_at: string
  status: 'pending' | 'posted' | 'failed'
  order_index?: number
  interval_minutes?: number
  error_message?: string
  posted_at?: string
  created_at: string
  user_id?: string
}

// Determine which table to use based on what exists and has data
async function getTableName(supabase: any): Promise<string> {
  // Try tweet_queue first (appears to be the active table)
  const { data: tweetQueueData, error: tweetQueueError } = await supabase
    .from('tweet_queue')
    .select('id')
    .limit(1)

  if (!tweetQueueError) {
    return 'tweet_queue'
  }

  // Try x_scheduled_posts as fallback
  const { error: scheduledPostsError } = await supabase
    .from('x_scheduled_posts')
    .select('id')
    .limit(1)

  if (!scheduledPostsError) {
    return 'x_scheduled_posts'
  }

  // Default to tweet_queue since that's what the existing code expects
  return 'tweet_queue'
}

export async function getScheduledPosts(): Promise<ScheduledPost[]> {
  const supabase = createClient()
  const tableName = await getTableName(supabase)
  
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .order('scheduled_at', { ascending: true })

  if (error) {
    console.error('Failed to fetch scheduled posts:', error)
    throw new Error(`Failed to fetch scheduled posts: ${error.message}`)
  }

  return data || []
}

export async function deleteScheduledPost(id: string): Promise<boolean> {
  const supabase = createClient()
  const adminClient = createAdminClient()
  const tableName = await getTableName(supabase)
  
  // Try with regular client first
  const { error: regularError } = await supabase
    .from(tableName)
    .delete()
    .eq('id', id)

  if (!regularError) {
    return true
  }

  // If regular client fails due to RLS, try with admin client
  if (regularError.message.includes('row-level security') || regularError.code === '42501') {
    const { error: adminError } = await adminClient
      .from(tableName)
      .delete()
      .eq('id', id)

    if (adminError) {
      console.error('Admin delete failed:', adminError)
      return false
    }
    
    return true
  }

  console.error('Delete failed:', regularError)
  return false
}

export async function deleteAllScheduledPosts(): Promise<{ success: boolean; deleted: number; errors?: any[] }> {
  const supabase = createClient()
  const adminClient = createAdminClient()
  const tableName = await getTableName(supabase)
  
  // First get all posts
  const { data: allPosts, error: selectError } = await adminClient
    .from(tableName)
    .select('id, content, status')

  if (selectError) {
    throw new Error(`Failed to fetch posts: ${selectError.message}`)
  }

  if (!allPosts || allPosts.length === 0) {
    return { success: true, deleted: 0 }
  }

  // Try bulk delete with admin client first
  const { error: bulkDeleteError } = await adminClient
    .from(tableName)
    .delete()
    .gte('id', '00000000-0000-0000-0000-000000000000') // Match all UUIDs

  if (!bulkDeleteError) {
    return { success: true, deleted: allPosts.length }
  }

  // If bulk delete fails, try individual deletes
  console.log('Bulk delete failed, attempting individual deletes:', bulkDeleteError)
  
  let deletedCount = 0
  const errors = []

  for (const post of allPosts) {
    const { error } = await adminClient
      .from(tableName)
      .delete()
      .eq('id', post.id)

    if (error) {
      errors.push({ id: post.id, error: error.message })
    } else {
      deletedCount++
    }
  }

  return {
    success: deletedCount > 0,
    deleted: deletedCount,
    errors: errors.length > 0 ? errors : undefined
  }
}

export async function deletePostsByStatus(status: string): Promise<{ success: boolean; deleted: number }> {
  const supabase = createClient()
  const adminClient = createAdminClient()
  const tableName = await getTableName(supabase)
  
  // Get posts with specific status
  const { data: posts, error: selectError } = await adminClient
    .from(tableName)
    .select('id')
    .eq('status', status)

  if (selectError) {
    throw new Error(`Failed to fetch posts with status ${status}: ${selectError.message}`)
  }

  if (!posts || posts.length === 0) {
    return { success: true, deleted: 0 }
  }

  // Delete posts with specific status
  const { error: deleteError } = await adminClient
    .from(tableName)
    .delete()
    .eq('status', status)

  if (deleteError) {
    throw new Error(`Failed to delete posts with status ${status}: ${deleteError.message}`)
  }

  return { success: true, deleted: posts.length }
}