'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiFetch'
import { HexRadarChart, type RadarAxis } from './HexRadarChart'
import { HudAxisWidget } from './HudAxisWidget'
import { EveStatusPanel } from './EveStatusPanel'
import { WorkspaceManager } from '@/components/cockpit/WorkspaceManager'
import { AddCardPanel } from '@/components/cockpit/AddCardPanel'
import { GridCanvas } from '@/components/cockpit/GridCanvas'
import { FocusTimer } from './FocusTimer'
import { useCockpitStore } from '@/stores/cockpitStore'
import type { LifeStatusResponse } from '@/app/api/cockpit/life-status/route'
import { Zap, Briefcase, Users, DollarSign, Compass, Leaf, Crosshair, Waves } from 'lucide-react'

const AXIS_META = [
  { id: 'energy', label: 'Energy', href: '/energy', icon: <Zap className="w-4 h-4" />, color: '#f59e0b' },
  { id: 'work', label: 'Work', href: '/work', icon: <Briefcase className="w-4 h-4" />, color: '#3b82f6' },
  { id: 'relationship', label: 'Relationship', href: '/relationship', icon: <Users className="w-4 h-4" />, color: '#f43f5e' },
  { id: 'finance', label: 'Finance', href: '/finance', icon: <DollarSign className="w-4 h-4" />, color: '#10b981' },
  { id: 'meaning', label: 'Meaning', href: '/meaning', icon: <Compass className="w-4 h-4" />, color: '#8b5cf6' },
  { id: 'lifestyle', label: 'Lifestyle', href: '/lifestyle', icon: <Leaf className="w-4 h-4" />, color: '#14b8a6' },
] as const

function statusToValue(status: string): number {
  if (status === 'good') return 75
  if (status === 'warning') return 25
  return 50
}

function getTimeGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 12) return 'GOOD MORNING, DRAKE'
  if (hour >= 12 && hour < 18) return 'AFTERNOON CHECKPOINT, DRAKE'
  if (hour >= 18 && hour < 22) return 'EVENING STATUS, DRAKE'
  return 'LATE SHIFT ACTIVE, DRAKE'
}

interface FocusTask { id: string; title: string }
interface FocusTasksResponse { tasks?: FocusTask[] }

function FocusModeView({ onBack }: { onBack: () => void }) {
  const { data } = useQuery<FocusTask[] | FocusTasksResponse>({
    queryKey: ['tasks-focus'],
    queryFn: () => apiFetch<FocusTask[] | FocusTasksResponse>('/api/tasks?status=todo&limit=3'),
    staleTime: 1000 * 60,
  })
  const tasks: FocusTask[] = Array.isArray(data) ? data : ((data as FocusTasksResponse)?.tasks ?? [])

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center border border-blue-400/30 bg-blue-400/8 text-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.16)]">
          <Crosshair className="h-6 w-6" />
        </div>
        <h2 className="hud-mono text-2xl font-bold tracking-[0.16em]">FOCUS MODE</h2>
        <p className="hud-mono mt-1 text-sm uppercase tracking-[0.08em] text-muted-foreground">Single target. No drift.</p>
      </div>
      <div className="hud-card w-full max-w-sm p-4"><FocusTimer /></div>
      {tasks.length > 0 && (
        <div className="hud-card w-full max-w-sm p-4">
          <div className="hud-label mb-3">오늘 할 일 TOP 3</div>
          <div className="space-y-2">
            {tasks.slice(0, 3).map(t => (
              <div key={t.id} className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                <span className="truncate">{t.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <button onClick={onBack} className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">Base Camp으로 돌아가기</button>
    </div>
  )
}

const CALM_QUOTES = [
  '壬水는 깊게 흐른다. 서두르지 않아도 바다에 닿는다.',
  '오늘 80%면 충분하다. 나머지는 내일의 피드백이 채운다.',
  '결정의 질은 정보량이 아니라 에너지 상태에서 온다.',
  '지금 멈추는 것이 내일 더 빠른 것이다.',
  '일을 잘하는 것보다 중요한 일을 하는 것이 먼저다.',
]

function CalmRoomView({ onBack }: { onBack: () => void }) {
  const d = new Date()
  const quote = CALM_QUOTES[(d.getDate() + d.getMonth() * 31) % CALM_QUOTES.length]
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10">
      <div className="max-w-md px-6 text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center border border-axis-meaning/35 bg-axis-meaning/10 text-axis-meaning shadow-[0_0_20px_rgba(139,92,246,0.14)]">
          <Waves className="h-6 w-6" />
        </div>
        <blockquote className="text-lg leading-relaxed font-medium text-foreground">&ldquo;{quote}&rdquo;</blockquote>
      </div>
      <div className="flex flex-col items-center gap-3">
        <div className="hud-mono text-xs uppercase tracking-widest text-muted-foreground">CALM LOOP</div>
        <div className="h-16 w-16 animate-ping border-2 border-axis-meaning/40 bg-axis-meaning/10" />
        <div className="hud-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">Inhale — Exhale</div>
      </div>
      <button onClick={onBack} className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">Base Camp으로 돌아가기</button>
    </div>
  )
}

function InstrumentStrip({
  title,
  axes,
  hoveredAxisId,
  onHover,
}: {
  title: string
  axes: RadarAxis[]
  hoveredAxisId: string | null
  onHover: (axisId: string | null) => void
}) {
  return (
    <div className="hud-card hud-frame-corners hidden min-w-[220px] flex-col overflow-hidden lg:flex">
      <div className="hud-panel-labelbar !mb-0">
        <span className="hud-label text-blue-300" style={{ fontSize: '10px' }}>{title}</span>
        <span className="hud-mono text-[9px] text-muted-foreground">MODULE</span>
      </div>
      <div className="flex flex-col gap-2 bg-white/[0.01] p-2.5">
        {axes.map(axis => {
          const meta = AXIS_META.find(m => m.id === axis.id)
          if (!meta) return null
          const active = hoveredAxisId === axis.id
          return (
            <Link
              key={axis.id}
              href={meta.href}
              onMouseEnter={() => onHover(axis.id)}
              onMouseLeave={() => onHover(null)}
              className="relative grid grid-cols-[42px_1fr_auto] items-center gap-3 border px-3 py-3 transition-all duration-150"
              style={{
                borderColor: active ? `${axis.color}55` : 'rgba(42,48,64,0.9)',
                background: active ? `${axis.color}10` : 'rgba(255,255,255,0.015)',
                boxShadow: active ? `0 0 18px ${axis.color}18` : 'none',
              }}
            >
              <div className="absolute bottom-0 left-0 top-0 w-px" style={{ background: active ? axis.color : `${axis.color}55` }} />
              <div
                className="relative"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '999px',
                  background: `conic-gradient(${axis.color} ${axis.value * 3.6}deg, #111827 ${axis.value * 3.6}deg)`,
                }}
              >
                <div className="absolute inset-1 flex items-center justify-center rounded-full" style={{ background: '#101827' }}>
                  <span className="hud-mono text-[9px] font-bold" style={{ color: axis.color }}>{axis.value}</span>
                </div>
              </div>

              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <span style={{ color: axis.color }}>{meta.icon}</span>
                  <span className="hud-label" style={{ color: axis.color, fontSize: '10px' }}>{axis.label}</span>
                </div>
                <div className="hud-mono truncate text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{axis.summary}</div>
              </div>

              <div className="text-right">
                <div className="hud-label" style={{ fontSize: '9px', color: axis.status === 'good' ? '#34d399' : axis.status === 'warning' ? '#fb7185' : '#fbbf24' }}>
                  {axis.status === 'good' ? 'GOOD' : axis.status === 'warning' ? 'WARN' : 'NORM'}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function HudDashboard() {
  const { wsName, wsIcon, wsSpecial, isBase, cardCount } = useCockpitStore(s => {
    const ws = s.workspaces.find(w => w.id === s.activeWorkspaceId)
    return {
      wsName: ws?.name ?? '대시보드',
      wsIcon: ws?.icon,
      wsSpecial: ws?.special,
      isBase: s.activeWorkspaceId === 'ws-base',
      cardCount: ws?.cards.length ?? 0,
    }
  })
  const setActiveWorkspace = useCockpitStore(s => s.setActiveWorkspace)
  const goToBase = () => setActiveWorkspace('ws-base')
  const [hoveredAxisId, setHoveredAxisId] = useState<string | null>(null)
  const [radarSize, setRadarSize] = useState(440)

  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth
      if (width < 420) setRadarSize(300)
      else if (width < 768) setRadarSize(336)
      else if (width < 1200) setRadarSize(380)
      else setRadarSize(440)
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const { data: lifeStatus } = useQuery<LifeStatusResponse>({
    queryKey: ['life-status'],
    queryFn: () => apiFetch<LifeStatusResponse>('/api/cockpit/life-status'),
    staleTime: 1000 * 60 * 5,
  })

  const radarAxes: RadarAxis[] = useMemo(() => AXIS_META.map(meta => {
    const axisData = lifeStatus?.axes.find(a => a.id === meta.id)
    return {
      id: meta.id,
      label: meta.label,
      color: meta.color,
      value: axisData ? statusToValue(axisData.status) : 50,
      status: (axisData?.status ?? 'normal') as RadarAxis['status'],
      summary: axisData?.summary ?? 'DATA LINK PENDING...',
    }
  }), [lifeStatus])

  const overall = Math.round(radarAxes.reduce((sum, axis) => sum + axis.value, 0) / Math.max(radarAxes.length, 1))
  const dashboardTimestamp = new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())

  if (wsSpecial === 'focus') return <div className="flex h-full flex-col"><FocusModeView onBack={goToBase} /></div>
  if (wsSpecial === 'calm') return <div className="flex h-full flex-col"><CalmRoomView onBack={goToBase} /></div>

  if (!isBase) {
    return (
      <div className="flex h-full flex-col">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">{wsIcon} {wsName}</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">{cardCount}개 카드</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <WorkspaceManager />
            <span className="hidden sm:inline-flex"><AddCardPanel /></span>
          </div>
        </div>
        <div className="-mx-4 flex-1 overflow-auto md:-mx-6"><GridCanvas /></div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-0 flex-col">
      <div className="pointer-events-none absolute inset-0 hud-grid-bg opacity-50" />
      <div className="pointer-events-none absolute inset-0 hud-vignette" />

      <div className="relative mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h1 className="hud-mono text-sm font-bold tracking-wide text-foreground sm:text-base">{getTimeGreeting()}</h1>
          <p className="hud-label mt-0.5">MISSION CONTROL · 6-AXIS LIFE OS</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <WorkspaceManager />
          <span className="hidden sm:inline-flex"><AddCardPanel /></span>
        </div>
      </div>

      <div className="relative grid grid-cols-1 items-start gap-4 lg:grid-cols-[230px_minmax(0,1fr)_300px] lg:items-stretch">
        <InstrumentStrip title="PORT / CORE AXES" axes={radarAxes.slice(0, 3)} hoveredAxisId={hoveredAxisId} onHover={setHoveredAxisId} />

        <div className="flex min-h-0 flex-col items-center justify-start gap-4 lg:justify-center">
          <div className="hud-card hud-frame-corners flex w-full max-w-none flex-col items-center gap-4 overflow-visible px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-7 lg:max-w-[760px]">
            <div className="hud-panel-labelbar !mb-0 w-full">
              <span className="hud-label text-blue-300" style={{ fontSize: '10px' }}>ARETE RADAR / LIFE SIGNALS</span>
              <span className="hud-mono text-[9px] text-muted-foreground">TOTAL {overall}</span>
            </div>

            <HexRadarChart axes={radarAxes} size={radarSize} hoveredAxisId={hoveredAxisId} onHoverAxis={setHoveredAxisId} timestamp={dashboardTimestamp} />

            <div className="grid w-full grid-cols-3 gap-1.5 sm:gap-2">
              {radarAxes.map(axis => (
                <div key={axis.id} className="border px-1.5 py-1.5 sm:px-2 sm:py-2 text-center overflow-hidden" style={{ borderColor: `${axis.color}30`, background: `${axis.color}08` }}>
                  <div className="hud-label mb-0.5 truncate" style={{ color: axis.color, fontSize: '8px' }}>{axis.label}</div>
                  <div className="hud-mono text-[10px] sm:text-xs" style={{ color: axis.color }}>{axis.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 lg:hidden">
            {radarAxes.map(axis => {
              const meta = AXIS_META.find(m => m.id === axis.id)
          if (!meta) return null
              return <HudAxisWidget key={axis.id} axis={axis} href={meta.href} icon={meta.icon} onHover={setHoveredAxisId} />
            })}
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-3">
          <InstrumentStrip title="STARBOARD / SUPPORT AXES" axes={radarAxes.slice(3)} hoveredAxisId={hoveredAxisId} onHover={setHoveredAxisId} />
          <div className="w-full">
            <EveStatusPanel />
          </div>
        </div>
      </div>

      <div className="relative mt-3 shrink-0 overflow-hidden border border-[#233044] bg-white/[0.02] px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-[#8fa3bf] hud-mono">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>SYS NOMINAL</span>
          <span className="text-[#2f4057]">|</span>
          <span className="hidden min-[420px]:inline">UPTIME: --:--:--</span>
          <span className="hidden min-[420px]:inline text-[#2f4057]">|</span>
          <span>EVE: ONLINE</span>
          <span className="text-[#2f4057]">|</span>
          <span className="hidden sm:inline">LAST SYNC: {dashboardTimestamp}</span>
        </div>
      </div>
    </div>
  )
}
