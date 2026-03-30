'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { RotateCcw, Zap, AlertTriangle } from 'lucide-react'
import { apiFetch } from '@/lib/apiFetch'
import type { EnergyLog, Routine, RoutineLog } from '@/types'
import { HudAxisPage, HudCard } from '@/components/layout/HudAxisPage'

const ENERGY_LINKS = [
  { href: '/routines', label: '루틴', icon: RotateCcw, desc: '일상 루틴 관리' },
]

const HOUR_LABELS: Record<number, string> = {
  6: '새벽', 7: '아침', 8: '아침', 9: '오전', 10: '오전', 11: '오전',
  12: '점심', 13: '오후', 14: '오후', 15: '오후', 16: '오후', 17: '저녁',
  18: '저녁', 19: '밤', 20: '밤', 21: '밤', 22: '심야', 23: '심야',
}

function EnergyBarChart({ entries }: { entries: Array<{ hour: number; level: number; note?: string }> }) {
  const maxLevel = 5
  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
        DATA LINK PENDING...
      </div>
    )
  }

  return (
    <div className="flex items-end gap-1.5 h-20">
      {entries.map(e => {
        const pct = (e.level / maxLevel) * 100
        const color =
          e.level >= 4 ? 'bg-emerald-500' :
          e.level >= 3 ? 'bg-yellow-500' :
          'bg-red-500'
        return (
          <div key={e.hour} className="flex flex-col items-center gap-1 flex-1" title={`${e.hour}시 — Lv.${e.level}${e.note ? ` (${e.note})` : ''}`}>
            <div className="w-full flex flex-col justify-end h-16">
              <div
                className={`w-full rounded-t ${color} opacity-80 transition-all`}
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className="text-[9px] text-muted-foreground">{e.hour}</span>
          </div>
        )
      })}
    </div>
  )
}

function EnergySummary() {
  const today = new Date().toISOString().split('T')[0]

  // Get this week's dates (Mon–Sun)
  const weekDates = (() => {
    const d = new Date()
    const day = d.getDay()
    const monday = new Date(d)
    monday.setDate(d.getDate() - ((day + 6) % 7))
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      return date.toISOString().split('T')[0]
    })
  })()

  const { data: energyLog, isLoading: energyLoading } = useQuery<EnergyLog>({
    queryKey: ['energy-log', today],
    queryFn: () => apiFetch<EnergyLog>(`/api/logs/energy?date=${today}`),
    staleTime: 1000 * 60 * 2,
  })

  const { data: routines = [], isLoading: routinesLoading } = useQuery<Routine[]>({
    queryKey: ['routines'],
    queryFn: () => apiFetch<Routine[]>('/api/routines'),
    staleTime: 1000 * 60 * 5,
  })

  // Fetch routine logs for the week
  const weekRoutineLogsQuery = useQuery<RoutineLog[]>({
    queryKey: ['routine-logs-week', weekDates[0]],
    queryFn: async () => {
      const results = await Promise.all(
        weekDates.map(d => apiFetch<RoutineLog>(`/api/logs/routine?date=${d}`).catch(() => ({ date: d, completions: [] } as RoutineLog)))
      )
      return results
    },
    staleTime: 1000 * 60 * 5,
  })

  const isLoading = energyLoading || routinesLoading || weekRoutineLogsQuery.isLoading

  if (isLoading) {
    return (
      <div className="space-y-3 mb-8">
        {[1, 2].map(i => (
          <div key={i} className="h-32 bg-card rounded-sm border border-border animate-pulse" />
        ))}
      </div>
    )
  }

  // Energy entries for today
  const todayEntries = energyLog?.entries ?? []
  const avgEnergy = todayEntries.length > 0
    ? Math.round(todayEntries.reduce((s, e) => s + e.level, 0) / todayEntries.length * 10) / 10
    : null

  // Routine completion rate this week
  const activeRoutines = routines.filter(r => r.is_active)
  const weekLogs = weekRoutineLogsQuery.data ?? []

  // Count completed routine-days up to today
  const todayIdx = weekDates.indexOf(today)
  const pastDates = weekDates.slice(0, todayIdx + 1)

  let totalExpected = 0
  let totalCompleted = 0

  for (const dateStr of pastDates) {
    const log = weekLogs.find(l => l.date === dateStr)
    const completedIds = new Set(log?.completions.map(c => c.routine_id) ?? [])
    for (const routine of activeRoutines) {
      // Check if routine should run on this day of week
      const dayOfWeek = new Date(dateStr).getDay() || 7 // 1=Mon...7=Sun
      if (!routine.days_of_week || routine.days_of_week.includes(dayOfWeek)) {
        totalExpected++
        if (completedIds.has(routine.id)) totalCompleted++
      }
    }
  }

  const completionRate = totalExpected > 0
    ? Math.round((totalCompleted / totalExpected) * 100)
    : null

  return (
    <div className="space-y-4 mb-8">
      {/* Today's energy chart */}
      <div className="hud-card p-4" style={{ borderLeft: '2px solid rgba(245,158,11,0.3)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium">오늘 에너지 로그</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {avgEnergy !== null
              ? <span className={avgEnergy >= 3.5 ? 'text-emerald-400' : avgEnergy >= 2.5 ? 'text-amber-400' : 'text-rose-400'}>
                  평균 {avgEnergy}/5
                </span>
              : 'AWAITING INPUT'}
          </div>
        </div>
        <EnergyBarChart entries={todayEntries} />
        {todayEntries.length > 0 && (
          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500 inline-block" /> 4~5 양호</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500 inline-block" /> 3 보통</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-500 inline-block" /> 1~2 주의</span>
          </div>
        )}
      </div>

      {/* Weekly routine completion rate */}
      <div className="hud-card p-4" style={{ borderLeft: '2px solid rgba(245,158,11,0.3)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium">이번 주 루틴 완료율</span>
          </div>
          <span className={`text-xs font-bold ${
            completionRate === null ? 'text-muted-foreground' :
            completionRate >= 70 ? 'text-emerald-400' :
            completionRate >= 40 ? 'text-amber-400' : 'text-rose-400'
          }`}>
            {completionRate !== null ? `${completionRate}%` : '-'}
          </span>
        </div>
        {completionRate !== null ? (
          <>
            <div className="w-full h-1.5 bg-[#111827] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  completionRate >= 70 ? 'bg-emerald-500' :
                  completionRate >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {totalCompleted} / {totalExpected} 완료 · 활성 루틴 {activeRoutines.length}개
            </div>
          </>
        ) : (
          <div className="text-xs text-muted-foreground">DATA LINK PENDING...</div>
        )}
      </div>
    </div>
  )
}

export default function EnergyPage() {
  return (
    <HudAxisPageWrapper />
  )
}

function HudAxisPageWrapper() {
  // We need hooks so this must be a component
  return <EnergyPageInner />
}

function EnergyPageInner() {
  const today = new Date().toISOString().split('T')[0]
  const { data: energyLog } = useQuery<EnergyLog>({
    queryKey: ['energy-log', today],
    queryFn: () => apiFetch<EnergyLog>(`/api/logs/energy?date=${today}`),
    staleTime: 1000 * 60 * 2,
  })
  const todayEntries = energyLog?.entries ?? []
  const avgEnergy = todayEntries.length > 0
    ? Math.round(todayEntries.reduce((s, e) => s + e.level, 0) / todayEntries.length * 20)
    : undefined

  return (
    <HudAxisPage
      title="ENERGY"
      subtitle="몸과 마음의 에너지 상태를 관리하고 루틴으로 충전한다."
      icon={<Zap className="w-6 h-6" />}
      color="#f59e0b"
      score={avgEnergy}
    >
      <div className="space-y-4">
        <EnergySummary />

        <HudCard title="바로가기" color="#f59e0b" icon={<Zap className="w-4 h-4" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ENERGY_LINKS.map(item => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 p-3 rounded border border-[#2a3040] hover:border-amber-500/40 hover:bg-amber-500/5 transition-all"
                >
                  <div className="w-8 h-8 rounded flex items-center justify-center shrink-0 bg-amber-500/10">
                    <Icon className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.desc}</div>
                  </div>
                </Link>
              )
            })}
            <Link
              href="/focus"
              className="flex items-center gap-3 p-3 rounded border border-[#2a3040] hover:border-amber-500/40 hover:bg-amber-500/5 transition-all"
            >
              <div className="w-8 h-8 rounded flex items-center justify-center shrink-0 bg-amber-500/10">
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="font-medium text-sm">에너지 로그 (포커스)</div>
                <div className="text-xs text-muted-foreground">집중 세션 & 에너지 기록</div>
              </div>
            </Link>
          </div>
        </HudCard>

        {/* Cross-domain hint */}
        <div
          className="p-4 flex items-start gap-3"
          style={{
            background: 'rgba(245,158,11,0.05)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: '2px',
          }}
        >
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-amber-400 mb-1">다른 축에 미치는 영향</div>
            <p className="text-xs text-muted-foreground">
              ⚠️ Energy가 낮으면 Work 판단 품질이 저하됩니다. 중요한 결정은 에너지가 충분할 때 하세요.
            </p>
          </div>
        </div>
      </div>
    </HudAxisPage>
  )
}
