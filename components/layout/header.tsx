'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, LogOut, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface HeaderProps {
  user: SupabaseUser | null
}

export function Header({ user }: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold text-gray-800">
          Noteクリエイター向け分析プラットフォーム
        </h2>
      </div>
      <div className="relative">
        <Button
          variant="ghost"
          className="flex items-center space-x-2"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <User className="h-5 w-5" />
          <span>{user?.email}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
            <button
              onClick={handleLogout}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="mr-2 h-4 w-4" />
              ログアウト
            </button>
          </div>
        )}
      </div>
    </header>
  )
}