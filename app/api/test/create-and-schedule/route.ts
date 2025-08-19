import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GPTsから受信したようなテストコンテンツを作成してスケジュール設定
export async function POST() {
  try {
    const supabase = createAdminClient()
    const now = new Date()
    
    console.log('=== Creating test GPTs content ===')
    
    // Step 1: GPTsから受信したようなコンテンツを作成（draft状態）
    const testContents = [
      {
        content: 'AIは未来の働き方を変える。リモートワークの普及により、地理的制約が消え、才能は世界中から集まる。',
        platform: 'x' as const,
        status: 'draft' as const,
        metadata: {
          source: 'gpts-test',
          title: 'AI時代の働き方',
          generatedBy: 'test-gpt',
          receivedAt: now.toISOString()
        }
      },
      {
        content: '今日は朝からコードを書いている。新しいプロジェクトのアーキテクチャ設計が楽しい。エンジニアリングの醍醐味だ。',
        platform: 'x' as const,
        status: 'draft' as const,
        metadata: {
          source: 'gpts-test',
          title: 'エンジニアの日常',
          generatedBy: 'test-gpt',
          receivedAt: now.toISOString()
        }
      },
      {
        content: 'Reactの新機能が発表された。Server Componentsは革命的だ。パフォーマンスが大幅に向上する。',
        platform: 'x' as const,
        status: 'draft' as const,
        metadata: {
          source: 'gpts-test',
          title: 'React最新情報',
          generatedBy: 'test-gpt',
          receivedAt: now.toISOString()
        }
      }
    ]
    
    const { data: createdContents, error: createError } = await supabase
      .from('scheduled_posts')
      .insert(testContents)
      .select()
    
    if (createError) {
      console.error('Failed to create test contents:', createError)
      return NextResponse.json({
        error: 'Failed to create test contents',
        details: createError.message
      }, { status: 500 })
    }
    
    console.log(`Created ${createdContents?.length} test contents`)
    
    // Step 2: スケジュール設定（10分後から30分間隔）
    const startTime = new Date(now.getTime() + 10 * 60 * 1000) // 10分後から開始
    const intervalMinutes = 30 // 30分間隔
    
    const scheduledContents = []
    
    for (let i = 0; i < (createdContents?.length || 0); i++) {
      const content = createdContents![i]
      const scheduledFor = new Date(startTime.getTime() + i * intervalMinutes * 60 * 1000)
      
      console.log(`Scheduling content ${content.id} for ${scheduledFor.toISOString()}`)
      
      const { data: updated, error: updateError } = await supabase
        .from('scheduled_posts')
        .update({
          scheduled_for: scheduledFor.toISOString(),
          status: 'pending' // cronが処理するステータス
        })
        .eq('id', content.id)
        .select()
        .single()
      
      if (updateError) {
        console.error(`Failed to schedule content ${content.id}:`, updateError)
      } else {
        scheduledContents.push(updated)
      }
    }
    
    // Step 3: 結果を確認
    const { data: allPosts } = await supabase
      .from('scheduled_posts')
      .select('*')
      .order('scheduled_for', { ascending: true })
    
    return NextResponse.json({
      success: true,
      message: 'Test contents created and scheduled',
      summary: {
        created: createdContents?.length || 0,
        scheduled: scheduledContents.length,
        firstScheduledTime: startTime.toISOString(),
        intervalMinutes
      },
      scheduledContents: scheduledContents.map(c => ({
        id: c.id,
        content: c.content.substring(0, 50) + '...',
        scheduled_for: c.scheduled_for,
        status: c.status
      })),
      allPosts: allPosts?.map(p => ({
        id: p.id,
        platform: p.platform,
        status: p.status,
        scheduled_for: p.scheduled_for
      }))
    })
  } catch (error) {
    console.error('Error in create-and-schedule:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}