import { Sidebar } from '@/components/layout/Sidebar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { OnboardingGate } from '@/components/onboarding/OnboardingGate'
import { GlobalSearch } from '@/components/search/GlobalSearch'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <OnboardingGate>
      <div className="flex min-h-screen md:h-screen md:overflow-hidden hud-grid-bg">
        <div className="hidden shrink-0 md:block">
          <Sidebar />
        </div>

        <main className="flex-1 md:overflow-y-auto px-4 py-4 pb-[calc(88px+env(safe-area-inset-bottom))] md:p-5 md:pb-5">
          <div className="mx-auto md:h-full w-full max-w-[1600px]">
            {children}
          </div>
        </main>

        <MobileBottomNav />
        <GlobalSearch />
      </div>
    </OnboardingGate>
  )
}
