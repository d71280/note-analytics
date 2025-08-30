import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { HybridScheduler } from '@/components/hybrid-scheduler'
import { OfflineSchedulerProvider } from '@/components/offline-scheduler-provider'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <OfflineSchedulerProvider>
      <div className="flex h-screen">
        <HybridScheduler />
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
            {children}
          </main>
        </div>
      </div>
    </OfflineSchedulerProvider>
  )
}