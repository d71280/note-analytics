# Uptime Robotで自動投稿を設定

## セットアップ手順

1. [Uptime Robot](https://uptimerobot.com/)にアクセスして無料アカウントを作成

2. 新しいモニターを作成：
   - Monitor Type: `HTTP(s)`
   - Friendly Name: `Note Analytics Auto Post`
   - URL: `https://note-analytics.vercel.app/api/test/trigger-cron`
   - Monitoring Interval: `5 minutes`（無料プランの最小間隔）
   - HTTP Method: `POST`
   - HTTP Headers: 
     ```
     Content-Type: application/json
     X-Manual-Test: true
     ```

3. アラート設定（オプション）：
   - エラー時のみ通知を受け取るように設定

## メリット
- 完全無料
- 5分間隔で実行可能
- ダウンタイム監視も兼ねる
- シンプルな設定