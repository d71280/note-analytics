'use client'

import { useOfflineScheduler, useOfflineStatus } from '@/lib/offline/scheduler'

export function OfflineSchedulerProvider({ children }: { children: React.ReactNode }) {
  // オフラインスケジューラーの初期化
  useOfflineScheduler()
  
  // オフラインステータスの監視
  useOfflineStatus()
  
  return <>{children}</>
}