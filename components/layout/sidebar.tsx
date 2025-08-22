'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TrendingUp, Bot, ListOrdered, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'トレンド分析', href: '/trends', icon: TrendingUp },
  { name: 'スケジュール投稿', href: '/scheduled-posts', icon: ListOrdered },
  { name: '設定', href: '/settings', icon: Settings },
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