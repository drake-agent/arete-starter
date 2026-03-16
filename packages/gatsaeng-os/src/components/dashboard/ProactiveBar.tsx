'use client'

import { useState, useEffect } from 'react'
import { useMilestonesWithDDay } from '@/hooks/useMilestones'
import { useRoutines } from '@/hooks/useRoutines'
import { AlertTriangle, Clock, Target, ChevronRight, X } from 'lucide-react'
import type { ProactiveAlert } from '@/types'

export function ProactiveBar() {
  const { data: milestones = [] } = useMilestonesWithDDay()
  const { routines } = useRoutines()
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  // build alerts from current data
  const alerts: ProactiveAlert[] = []
  const now = new Date()
  const hour = now.getHours()

  // 1. milestone D-day alerts (≤ 7 days)
  milestones
    .filter(m => m.status === 'active' && m.d_day <= 7 && m.d_day >= 0)
    .forEach(m => {
      alerts.push({
        id: `ms-${m.id}`,
        type: 'milestone_dday',
        title: m.d_day === 0 ? 'D-Day!' : `D-${m.d_day}`,
        message: m.title,
        created_at: now.toISOString(),
      })
    })

  // 2. skipped routine alerts (only after 11am)
  if (hour >= 11) {
    const skipped = routines.filter(r => !r.completed_today)
    if (skipped.length > 0) {
      alerts.push({
        id: 'skipped-routines',
        type: 'skipped_routine',
        title: `미완료 루틴 ${skipped.length}개`,
        message: skipped.slice(0, 3).map(r => r.title).join(', '),
        created_at: now.toISOString(),
      })
    }
  }

  // 3. overdue milestones
  milestones
    .filter(m => m.status === 'active' && m.d_day < 0)
    .slice(0, 2)
    .forEach(m => {
      alerts.push({
        id: `overdue-${m.id}`,
        type: 'deadline',
        title: `D+${Math.abs(m.d_day)} 초과`,
        message: m.title,
        created_at: now.toISOString(),
      })
    })

  const visible = alerts.filter(a => !dismissed.has(a.id))

  if (visible.length === 0) return null

  const iconMap: Record<ProactiveAlert['type'], React.ReactNode> = {
    skipped_routine: <Clock className="w-3.5 h-3.5" />,
    deadline: <AlertTriangle className="w-3.5 h-3.5" />,
    milestone_dday: <Target className="w-3.5 h-3.5" />,
    reanalysis_due: <ChevronRight className="w-3.5 h-3.5" />,
  }

  const colorMap: Record<ProactiveAlert['type'], string> = {
    skipped_routine: 'bg-gatsaeng-amber/10 border-gatsaeng-amber/30 text-gatsaeng-amber',
    deadline: 'bg-gatsaeng-red/10 border-gatsaeng-red/30 text-gatsaeng-red',
    milestone_dday: 'bg-gatsaeng-purple/10 border-gatsaeng-purple/30 text-gatsaeng-purple',
    reanalysis_due: 'bg-primary/10 border-primary/30 text-primary',
  }

  return (
    <div className="space-y-2 mb-4">
      {visible.map(alert => (
        <div
          key={alert.id}
          className={`flex items-center gap-3 px-4 py-2 rounded-lg border text-sm ${colorMap[alert.type]}`}
        >
          {iconMap[alert.type]}
          <span className="font-medium">{alert.title}</span>
          <span className="text-foreground/70">{alert.message}</span>
          <button
            onClick={() => setDismissed(prev => new Set(prev).add(alert.id))}
            className="ml-auto opacity-50 hover:opacity-100 transition-opacity"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
