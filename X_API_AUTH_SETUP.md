# X API Authentication Setup Guide

## Overview

The X API posting system now supports two authentication methods:

1. **Bearer Token Authentication (Recommended)** - OAuth 2.0 
2. **OAuth 1.0a Authentication (Fallback)** - Traditional OAuth

## Method 1: Bearer Token Authentication (Recommended)

### Why Bearer Token?
- More secure and reliable
- No expiration issues (unlike access tokens that expire every 2 hours)
- Simpler to implement and maintain
- Better for X API v2

### Setup Steps

1. **Get Bearer Token from X Developer Portal:**
   - Go to https://developer.twitter.com
   - Select your project/app
   - Go to "Keys and tokens" tab
   - Under "Bearer Token", click "Generate" or "Regenerate"
   - Copy the Bearer Token (it starts with `AAAAAAAAAA...`)

2. **Set Environment Variable:**
   ```bash
   X_BEARER_TOKEN=your_bearer_token_here
   ```

That's it! The system will automatically use Bearer token authentication when `X_BEARER_TOKEN` is set.

## Method 2: OAuth 1.0a Authentication (Fallback)

### When to use?
- If Bearer token is not available
- For compatibility with legacy systems
- When you need user-specific authentication

### Setup Steps

1. **Get Credentials from X Developer Portal:**
   - Go to https://developer.twitter.com
   - Select your project/app
   - Go to "Keys and tokens" tab
   - Copy the following:
     - API Key
     - API Secret Key
     - Access Token
     - Access Token Secret

2. **Set Environment Variables:**
   ```bash
   X_API_KEY=your_api_key_here
   X_API_SECRET=your_api_secret_here  # or X_API_KEY_SECRET
   X_ACCESS_TOKEN=your_access_token_here
   X_ACCESS_SECRET=your_access_token_secret_here
   ```

### Important Notes for OAuth 1.0a:
- Access tokens expire every 2 hours on free tier
- You'll need to regenerate tokens when they expire
- 401 errors typically mean expired tokens

## Environment Variable Priority

The system checks credentials in this order:

1. If `X_BEARER_TOKEN` is set → Uses Bearer token authentication
2. If Bearer token is not set → Falls back to OAuth 1.0a
3. If OAuth 1.0a credentials are missing → Returns error

## Vercel Deployment Setup

### For Bearer Token (Recommended):
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add:
   - Name: `X_BEARER_TOKEN`
   - Value: Your Bearer token
   - Environment: All Environments

### For OAuth 1.0a:
1. Add these environment variables in Vercel:
   - `X_API_KEY`
   - `X_API_SECRET` (or `X_API_KEY_SECRET`)
   - `X_ACCESS_TOKEN`
   - `X_ACCESS_SECRET`

## Testing Your Setup

Use the test connection endpoint to verify your setup:

```bash
curl -X POST https://your-domain.com/api/x/test-connection
```

The response will show:
- Whether the connection is successful
- Which authentication method is being used
- Your user information

## Troubleshooting

### 401 Authentication Errors

**If using Bearer token:**
- Verify the Bearer token is correct and complete
- Make sure it starts with `AAAAAAAA...`
- Regenerate the Bearer token if needed

**If using OAuth 1.0a:**
- Access tokens expire every 2 hours - regenerate them
- Verify all 4 credentials are set correctly
- Consider switching to Bearer token for better reliability

### Rate Limits
- Free tier: 1,500 tweets per month
- If you hit limits, wait for the monthly reset or upgrade your plan

### Best Practices
1. **Use Bearer Token**: More reliable than OAuth 1.0a
2. **Monitor Rate Limits**: Track your usage to avoid hitting limits
3. **Handle Errors Gracefully**: Implement proper error handling in your apps
4. **Keep Credentials Secure**: Never commit them to version control

## Recent Changes

The authentication system has been updated to:
- Prioritize Bearer token authentication for better reliability
- Provide fallback support for OAuth 1.0a
- Give clearer error messages for authentication failures
- Support both authentication methods in all endpoints

For the best experience, use Bearer token authentication with the `X_BEARER_TOKEN` environment variable.