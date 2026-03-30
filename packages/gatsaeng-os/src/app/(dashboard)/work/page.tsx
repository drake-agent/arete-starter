'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Target, FolderKanban, CheckSquare, RotateCcw, StickyNote, AlertTriangle, Mic, Clock, Briefcase } from 'lucide-react'
import { apiFetch } from '@/lib/apiFetch'
import type { Project, Task, Meeting } from '@/types'
import { HudAxisPage, HudCard } from '@/components/layout/HudAxisPage'

const WORK_LINKS = [
  { href: '/goals', command: 'GOALS', icon: Target, signal: 'TRACK', detail: 'Mission targets & progress lock' },
  { href: '/projects', command: 'PROJECTS', icon: FolderKanban, signal: 'BUILD', detail: 'Pipeline / kanban / active ops' },
  { href: '/tasks', command: 'TASKS', icon: CheckSquare, signal: 'EXEC', detail: 'Priority queue & due signals' },
  { href: '/routines', command: 'ROUTINES', icon: RotateCcw, signal: 'RHYTHM', detail: 'Repeat systems & cadence' },
  { href: '/notes', command: 'NOTES', icon: StickyNote, signal: 'LOG', detail: 'Capture memos & command context' },
]

function WorkSummary() {
  const today = new Date().toISOString().split('T')[0]

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => apiFetch<Project[]>('/api/projects'),
    staleTime: 1000 * 60 * 5,
  })

  const { data: todoTasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['tasks', 'todo'],
    queryFn: () => apiFetch<Task[]>('/api/tasks?status=todo'),
    staleTime: 1000 * 60 * 2,
  })

  const activeProjects = projects.filter(p => p.status === 'active')
  const overdueTasks = todoTasks.filter(t =>
    t.due_date && t.due_date.slice(0, 10) < today && t.status !== 'done'
  )
  const todayTasks = todoTasks.filter(t =>
    t.due_date && t.due_date.slice(0, 10) === today
  )

  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
  const top3 = [...todoTasks]
    .sort((a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2))
    .slice(0, 3)

  const isLoading = projectsLoading || tasksLoading

  if (isLoading) {
    return (
      <div className="mb-8 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 rounded-sm border border-border bg-card animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="mb-4 space-y-3 md:mb-8 md:space-y-4">
      {overdueTasks.length > 0 && (
        <div
          className="flex items-start gap-3 overflow-hidden p-3 md:p-4"
          style={{ background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '2px' }}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
          <div>
            <div className="text-sm font-medium text-rose-400">오버듀 태스크 {overdueTasks.length}개</div>
            <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
              {overdueTasks.slice(0, 3).map(t => (
                <div key={t.id} className="truncate">· {t.title}</div>
              ))}
              {overdueTasks.length > 3 && (
                <div className="text-muted-foreground/60">+{overdueTasks.length - 3}개 더</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="hud-card overflow-hidden p-3 md:p-4" style={{ borderLeft: '2px solid rgba(59,130,246,0.3)' }}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium">진행 중 프로젝트</span>
          </div>
          <span className="text-xs text-muted-foreground">{activeProjects.length}개</span>
        </div>
        {activeProjects.length === 0 ? (
          <div className="hud-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">DATA LINK PENDING...</div>
        ) : (
          <div className="space-y-1.5">
            {activeProjects.slice(0, 5).map(p => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="inline-flex min-h-[44px] w-full items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <div
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: p.color ?? '#7c5cbf' }}
                />
                <span className="truncate">{p.title}</span>
              </Link>
            ))}
            {activeProjects.length > 5 && (
              <div className="text-xs text-muted-foreground/60">+{activeProjects.length - 5}개 더</div>
            )}
          </div>
        )}
      </div>

      <div className="hud-card overflow-hidden p-3 md:p-4" style={{ borderLeft: '2px solid rgba(59,130,246,0.3)' }}>
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium">오늘 할일 TOP 3</span>
          </div>
          <span className="text-xs text-muted-foreground">
            오늘 {todayTasks.length}개 · 전체 {todoTasks.length}개
          </span>
        </div>
        {top3.length === 0 ? (
          <div className="hud-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">AWAITING INPUT</div>
        ) : (
          <div className="space-y-2">
            {top3.map((t, i) => (
              <div key={t.id} className="flex min-h-[44px] items-start gap-2">
                <span className="w-4 shrink-0 pt-0.5 text-xs text-muted-foreground">{i + 1}.</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium">{t.title}</div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      t.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                      t.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                      t.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {t.priority === 'urgent' ? '긴급' : t.priority === 'high' ? '높음' : t.priority === 'medium' ? '보통' : '낮음'}
                    </span>
                    {t.due_date && (
                      <span className="text-[10px] text-muted-foreground">
                        {t.due_date.slice(5)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function RecentMeetings() {
  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
    queryKey: ['meetings'],
    queryFn: async () => {
      const res = await fetch('/api/meetings')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    },
    staleTime: 1000 * 60 * 5,
  })

  const recent = meetings.slice(0, 3)

  return (
    <div className="hud-card mt-3 overflow-hidden p-3 md:mt-4 md:p-4" style={{ borderLeft: '2px solid rgba(59,130,246,0.3)' }}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-semibold">최근 미팅</span>
        </div>
        <Link href="/meetings" className="hud-mono inline-flex min-h-[44px] items-center text-xs uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground">
          OPEN LOG
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 rounded-sm bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && recent.length === 0 && (
        <p className="py-3 text-center text-xs text-muted-foreground">미팅 기록이 없습니다.</p>
      )}

      {!isLoading && recent.length > 0 && (
        <div className="space-y-2">
          {recent.map(m => (
            <div key={m.fileId} className="flex items-start gap-3 rounded-sm p-2 transition-colors hover:bg-muted/50">
              <Mic className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="line-clamp-2 text-xs font-medium break-words">{m.title}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                  {m.date && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {m.date}
                    </span>
                  )}
                  {m.domains.length > 0 && (
                    <span>{m.domains.join(' · ')}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function WorkPage() {
  return (
    <HudAxisPage
      title="WORK"
      subtitle="목표·프로젝트·태스크·루틴·노트 — 일의 모든 것을 한 축에서."
      icon={<Briefcase className="w-6 h-6" />}
      color="#3b82f6"
    >
      <div className="space-y-3 pb-20 md:space-y-4 md:pb-4">
        <WorkSummary />

        <HudCard title="QUICK ACCESS" color="#3b82f6" icon={<Briefcase className="w-4 h-4" />} topRight="WORK BUS">
          <div className="hud-scanlines border border-[#243048] bg-[#0c1423]/80 px-2 py-2">
            {/* Mobile: horizontal scroll strip; md+: 2-col grid; xl: 5-col */}
            <div className="-mx-0 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 xl:grid-cols-5">
              {WORK_LINKS.map(item => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex snap-start border border-[#2a3040] bg-[#0f1726]/90 px-3 py-3 transition-all duration-150 hover:-translate-y-[1px] hover:scale-[1.02]
                      min-h-[112px] w-[140px] shrink-0 flex-col
                      md:min-h-[132px] md:w-auto md:shrink md:flex-1"
                    style={{ boxShadow: 'inset 0 0 0 1px rgba(59,130,246,0.04)' }}
                  >
                    <div className="flex w-full flex-col justify-between gap-3 h-full">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-blue-400/30 bg-blue-400/8 text-blue-300 transition-all duration-150 group-hover:border-blue-400/60 group-hover:bg-blue-400/12 group-hover:shadow-[0_0_16px_rgba(59,130,246,0.22)]
                          md:h-11 md:w-11">
                          <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </div>
                        <span className="hud-mono text-[8px] tracking-[0.14em] text-blue-300/80 md:text-[9px] md:tracking-[0.18em]">{item.signal}</span>
                      </div>
                      <div className="space-y-0.5 md:space-y-1">
                        <div className="hud-mono text-[10px] tracking-[0.16em] text-foreground md:text-[11px] md:tracking-[0.18em]">{item.command}</div>
                        <div className="hud-mono truncate text-[9px] uppercase tracking-[0.06em] leading-[1.4] text-muted-foreground md:text-[10px] md:tracking-[0.08em] md:leading-[1.45] md:whitespace-normal md:overflow-visible">
                          {item.detail}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </HudCard>

        <RecentMeetings />

        <div
          className="flex items-start gap-3 overflow-hidden p-3 md:p-4"
          style={{
            background: 'rgba(59,130,246,0.05)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: '2px',
          }}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
          <div className="min-w-0 flex-1">
            <div className="hud-mono mb-1 text-xs font-medium uppercase tracking-[0.10em] text-blue-400 md:text-sm md:tracking-[0.14em]">Cross-axis note</div>
            <p className="hud-mono break-words text-[10px] uppercase leading-5 tracking-[0.06em] text-muted-foreground md:text-xs md:tracking-[0.08em]">
              Work overload can pull down energy. Use focus sessions and routines to stabilize output.
            </p>
          </div>
        </div>
      </div>
    </HudAxisPage>
  )
}
