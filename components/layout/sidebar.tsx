'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, TrendingUp, Settings, Share2, Search, Calendar, Database, Brain, ListOrdered, Twitter } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: '記事分析', href: '/analyze', icon: FileText },
  { name: 'トレンド', href: '/trends', icon: TrendingUp },
  { name: 'コンテンツ生成&配信', href: '/x-search', icon: Search },
  { name: '知識ベース', href: '/knowledge', icon: Brain },
  { name: 'スケジュール', href: '/schedule', icon: Calendar },
  { name: '投稿管理', href: '/scheduled-posts', icon: ListOrdered },
  { name: 'X連携設定', href: '/settings', icon: Share2 },
  { name: 'データ管理', href: '/admin', icon: Settings },
  { name: 'DB状態確認', href: '/admin/db-check', icon: Database },
  { name: 'X API確認', href: '/admin/x-api-check', icon: Twitter },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      <div className="flex h-16 items-center px-6">
        <h1 className="text-xl font-bold text-white">Note Analytics</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}