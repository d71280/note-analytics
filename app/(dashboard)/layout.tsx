import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { AutoScheduler } from '@/components/auto-scheduler'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <AutoScheduler />
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}