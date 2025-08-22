import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { content, postId } = await req.json()

    // X API認証情報を環境変数から取得
    const X_API_KEY = Deno.env.get('X_API_KEY')
    const X_API_SECRET = Deno.env.get('X_API_SECRET')
    const X_ACCESS_TOKEN = Deno.env.get('X_ACCESS_TOKEN')
    const X_ACCESS_TOKEN_SECRET = Deno.env.get('X_ACCESS_TOKEN_SECRET')

    if (!X_API_KEY || !X_API_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_TOKEN_SECRET) {
      throw new Error('Missing X API credentials')
    }

    // OAuth 1.0a署名を生成
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const nonce = crypto.randomUUID().replace(/-/g, '')
    
    const params = {
      oauth_consumer_key: X_API_KEY,
      oauth_nonce: nonce,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: timestamp,
      oauth_token: X_ACCESS_TOKEN,
      oauth_version: '1.0'
    }

    // 署名ベース文字列を作成
    const baseURL = 'https://api.twitter.com/2/tweets'
    const method = 'POST'
    
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&')
    
    const signatureBaseString = `${method}&${encodeURIComponent(baseURL)}&${encodeURIComponent(paramString)}`
    const signingKey = `${encodeURIComponent(X_API_SECRET)}&${encodeURIComponent(X_ACCESS_TOKEN_SECRET)}`
    
    // HMAC-SHA1署名を生成
    const encoder = new TextEncoder()
    const keyData = encoder.encode(signingKey)
    const messageData = encoder.encode(signatureBaseString)
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    )
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
    const oauth_signature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    
    // Authorizationヘッダーを構築
    const authHeader = `OAuth oauth_consumer_key="${X_API_KEY}", oauth_nonce="${nonce}", oauth_signature="${encodeURIComponent(oauth_signature)}", oauth_signature_method="HMAC-SHA1", oauth_timestamp="${timestamp}", oauth_token="${X_ACCESS_TOKEN}", oauth_version="1.0"`

    // X APIにPOST
    const response = await fetch(baseURL, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: content })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`X API error: ${error}`)
    }

    const data = await response.json()

    // Supabaseでステータスを更新
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    if (postId) {
      await supabase
        .from('scheduled_posts')
        .update({
          status: 'posted',
          metadata: {
            posted_at: new Date().toISOString(),
            tweet_id: data.data.id
          }
        })
        .eq('id', postId)
    }

    return new Response(
      JSON.stringify({ success: true, tweetId: data.data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})