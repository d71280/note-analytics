// X API v2の制限設定
export const X_API_LIMITS = {
  // Basic tier (無料プラン) の制限
  basic: {
    dailyPostLimit: 17,           // 1日の投稿上限
    monthlyPostLimit: 500,        // 月間投稿上限
    monthlyReadLimit: 100,        // 月間読み取り上限
    retweetLimit: 17,             // 1日のリツイート上限（投稿と同じ）
    searchResultsPerRequest: 10,  // 1回の検索で取得できる最大件数
  },
  
  // レート制限
  rateLimit: {
    postsPerHour: 5,             // 1時間あたりの投稿数
    retweetsPerHour: 5,          // 1時間あたりのリツイート数
    searchesPerMinute: 1,        // 1分あたりの検索回数
    delayBetweenActions: 2000,   // アクション間の遅延（ミリ秒）
  },
  
  // 推奨設定
  recommendations: {
    autoRetweetPerDay: 10,       // 自動リツイートの推奨上限
    searchKeywordsMax: 5,        // 検索キーワードの最大数
    minIntervalHours: 1,         // 自動実行の最小間隔（時間）
  }
}

// APIリミットチェック用のヘルパー関数
export const checkDailyLimit = (currentCount: number): boolean => {
  return currentCount < X_API_LIMITS.basic.dailyPostLimit
}

export const checkMonthlyLimit = (currentCount: number, type: 'post' | 'read'): boolean => {
  const limit = type === 'post' 
    ? X_API_LIMITS.basic.monthlyPostLimit 
    : X_API_LIMITS.basic.monthlyReadLimit
  return currentCount < limit
}