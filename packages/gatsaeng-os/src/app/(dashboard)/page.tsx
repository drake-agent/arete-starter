'use client'

import { DashboardGrid } from '@/components/dashboard/DashboardGrid'
import { WidgetCustomizer } from '@/components/dashboard/WidgetCustomizer'

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            대시보드
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            갓생 Mission Control
          </p>
        </div>
        <WidgetCustomizer />
      </div>

      <div className="flex-1 overflow-auto">
        <DashboardGrid />
      </div>
    </div>
  )
}
