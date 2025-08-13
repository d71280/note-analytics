import { createClient } from '@/lib/supabase/server'
import { getXApiConfig } from '@/lib/x-api/config'
import OAuth from 'oauth-1.0a'
import crypto from 'crypto'
import axios from 'axios'

// X API v2を使用（Free tierではv1.1にアクセスできない）
const TWITTER_API_URL = 'https://api.twitter.com/2/tweets'

// X（Twitter）への直接投稿
export async function postToXDirect(content: string, metadata?: Record<string, unknown>) {
  try {
    // 環境変数からX API設定を取得
    let config
    try {
      config = getXApiConfig()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('X API config error:', errorMessage)
      return { 
        success: false, 
        error: `設定エラー: ${errorMessage}`
      }
    }

    // OAuth 1.0a設定
    const oauth = new OAuth({
      consumer: {
        key: config.apiKey,
        secret: config.apiKeySecret,
      },
      signature_method: 'HMAC-SHA1',
      hash_function(base_string, key) {
        return crypto
          .createHmac('sha1', key)
          .update(base_string)
          .digest('base64')
      },
    })

    const token = {
      key: config.accessToken,
      secret: config.accessTokenSecret,
    }

    // リクエストデータ
    const requestData = {
      url: TWITTER_API_URL,
      method: 'POST' as const,
      data: { text: content },
    }

    const authHeader = oauth.toHeader(oauth.authorize(requestData, token))

    // X APIに投稿
    const response = await axios.post(
      TWITTER_API_URL,
      { text: content },
      {
        headers: {
          ...authHeader,
          'Content-Type': 'application/json',
        },
        validateStatus: () => true, // すべてのステータスコードを許可
      }
    )

    if (response.status === 201) {
      const tweetId = response.data.data?.id
      const tweetUrl = tweetId 
        ? `https://twitter.com/user/status/${tweetId}`
        : 'https://twitter.com'

      // 成功を記録
      const supabase = createClient()
      await supabase
        .from('analytics')
        .insert({
          platform: 'x',
          impressions: 0,
          engagements: 0,
          tracked_at: new Date().toISOString(),
          metadata: {
            tweet_id: tweetId,
            text: content,
            posted_at: new Date().toISOString(),
            post_type: metadata?.postType || 'scheduled'
          }
        })

      return { 
        success: true, 
        postId: tweetId,
        url: tweetUrl
      }
    } else {
      console.error('X API error:', response.data)
      return { 
        success: false, 
        error: response.data?.detail || response.data?.error || 'Failed to post'
      }
    }
  } catch (error) {
    console.error('Failed to post to X:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error'
    }
  }
}

// Noteへの直接投稿（現在は未実装）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function postToNoteDirect(content: string, metadata?: Record<string, unknown>) {
  try {
    // Note APIの実装が必要
    console.log('Note posting not implemented yet')
    return { 
      success: false, 
      error: 'Note API not implemented'
    }
  } catch (error) {
    console.error('Failed to post to Note:', error)
    return { 
      success: false, 
      error: 'Network error'
    }
  }
}

// WordPressへの直接投稿（現在は未実装）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function postToWordPressDirect(content: string, metadata?: Record<string, unknown>) {
  try {
    // WordPress APIの実装が必要
    console.log('WordPress posting not implemented yet')
    return { 
      success: false, 
      error: 'WordPress API not implemented'
    }
  } catch (error) {
    console.error('Failed to post to WordPress:', error)
    return { 
      success: false, 
      error: 'Network error'
    }
  }
}