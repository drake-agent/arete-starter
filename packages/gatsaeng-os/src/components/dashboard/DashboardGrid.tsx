'use client'

import { useQuery } from '@tanstack/react-query'
import { useDashboardStore } from '@/stores/dashboardStore'
import { RoutineChecklist } from './RoutineChecklist'
import { GoalRings } from './GoalRings'
import { FocusTimer } from './FocusTimer'
import { GatsaengScore } from './GatsaengScore'
import { ZeigarnikPanel } from './ZeigarnikPanel'
import { EnergyTracker } from './EnergyTracker'
import { DdayWidget } from './DdayWidget'
import { ProactiveBar } from './ProactiveBar'
import { TimingWidget } from './TimingWidget'
import type { WidgetId } from '@/types'

const WIDGETS: Partial<Record<WidgetId, React.ComponentType>> = {
  routine: RoutineChecklist,
  goals: GoalRings,
  timer: FocusTimer,
  zeigarnik: () => null, // rendered separately as top bar
  energy: EnergyTracker,
  dday: DdayWidget,
  proactive: () => null, // rendered as top bar
  heatmap: () => (
    <div className="border border-border rounded-lg p-6 text-center text-muted-foreground text-sm">
      Activity Heatmap — coming soon
    </div>
  ),
  kanban: () => (
    <div className="border border-border rounded-lg p-6 text-center text-muted-foreground text-sm">
      Quick Kanban — coming soon
    </div>
  ),
}

export function DashboardGrid() {
  const { activeWidgets } = useDashboardStore()
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await fetch('/api/profile')
      return res.json()
    },
    staleTime: 1000 * 60 * 30,
  })

  const displayWidgets = activeWidgets.filter(w => w !== 'zeigarnik' && w !== 'proactive')

  return (
    <div className="space-y-6">
      {/* Proactive alerts bar */}
      {activeWidgets.includes('proactive') && <ProactiveBar />}

      {/* Zeigarnik panel */}
      {activeWidgets.includes('zeigarnik') && <ZeigarnikPanel />}

      {/* Saju motto banner */}
      {profile?.saju_motto && (
        <div className="border border-gatsaeng-purple/30 bg-gatsaeng-purple/5 rounded-lg px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-gatsaeng-purple/60 mb-1">
            사주 모토
          </div>
          <p className="text-sm text-foreground font-medium">{profile.saju_motto}</p>
          {profile.saju_identity && (
            <p className="text-xs text-muted-foreground mt-1">{profile.saju_identity}</p>
          )}
        </div>
      )}

      {/* Score + Timing row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GatsaengScore />
        <TimingWidget />
      </div>

      {/* Widget grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayWidgets.map(widgetId => {
          const Widget = WIDGETS[widgetId]
          if (!Widget) return null
          return <Widget key={widgetId} />
        })}
      </div>
    </div>
  )
}
