import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { ProductionScheduler } from '@/components/production-scheduler'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <ProductionScheduler />
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