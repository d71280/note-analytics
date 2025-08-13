# cron-job.orgで自動投稿を設定

## セットアップ手順

1. [cron-job.org](https://cron-job.org/)にアクセスして無料アカウントを作成

2. 新しいCronジョブを作成：
   - Title: `Note Analytics Auto Post`
   - URL: `https://note-analytics.vercel.app/api/test/trigger-cron`
   - Schedule: 
     - Execution schedule: `Every 5 minutes`
     - または Custom: `*/5 * * * *`
   - Request method: `POST`
   - Request headers:
     ```
     Content-Type: application/json
     X-Manual-Test: true
     ```

3. 時間設定の例：
   - `*/15 * * * *` - 15分ごと
   - `0 * * * *` - 毎時0分
   - `0 9,21 * * *` - 毎日9時と21時
   - `0 9 * * 1-5` - 平日の9時

## メリット
- 完全無料
- 1分間隔まで設定可能
- 複雑なcron式に対応
- 実行履歴が見れる