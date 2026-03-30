'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, CheckCircle2, Sparkles, ClipboardList, Lightbulb, Radio, ChevronDown, ChevronUp } from 'lucide-react'
import { apiFetch } from '@/lib/apiFetch'

interface PendingItem {
  id: string
  title: string
  priority?: string
  status?: string
}

interface HandoffData {
  date: string
  nextActions: string[]
  openDecisions: string[]
  eveSuggestions: string[]
}

interface EveCardData {
  pending: PendingItem[]
  missions: string[]
  dailySummary: string | null
  handoff: HandoffData | null
  updatedAt: string
}

export function EveStatusPanel() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { data, isLoading, isError, dataUpdatedAt } = useQuery<EveCardData>({
    queryKey: ['cockpit-eve'],
    queryFn: () => apiFetch<EveCardData>('/api/cockpit/eve'),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  })

  const updatedTime = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    : ''

  const pending = data?.pending ?? []
  const high = pending.filter(p => p.priority?.includes('🔴'))
  const mid = pending.filter(p => p.priority?.includes('🟡'))
  const handoff = data?.handoff ?? null

  return (
    <div className="hud-card hud-frame-corners overflow-hidden" style={{ borderColor: 'rgba(96,165,250,0.35)' }}>
      <div className="hud-panel-labelbar !mb-0" style={{ background: 'linear-gradient(90deg, rgba(96,165,250,0.16), rgba(255,255,255,0.02))' }}>
        <div className="flex items-center gap-2">
          <div className="relative h-3 w-3 shrink-0">
            <div className="eve-pulse h-3 w-3 rounded-full bg-blue-400" />
            <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-20" />
          </div>
          <Radio className="h-3.5 w-3.5 text-blue-400" />
          <span className="hud-label text-blue-300" style={{ fontSize: '10px' }}>SYSTEM MESSAGES</span>
        </div>
        {updatedTime && <span className="hud-mono text-[9px] text-muted-foreground">SYNC {updatedTime}</span>}
      </div>

      <button
        type="button"
        onClick={() => setMobileOpen(v => !v)}
        className="flex w-full items-center gap-2 border-b border-[#2a3040] bg-white/[0.02] px-4 py-3 text-left lg:cursor-default"
      >
        <Sparkles className="h-3.5 w-3.5 text-blue-400" />
        <span className="hud-label text-blue-400">EVE STATUS STREAM</span>
        <span className="ml-auto text-[10px] text-muted-foreground lg:hidden">{mobileOpen ? '접기' : '펼치기'}</span>
        <span className="lg:hidden">{mobileOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}</span>
      </button>

      <div className={mobileOpen ? 'block lg:block' : 'hidden lg:block'}>
        <div className="max-h-[420px] overflow-y-auto p-4 leading-[1.45] space-y-4 lg:max-h-none lg:min-h-[240px]">
          {isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-5 bg-muted/20 animate-pulse" />)}
            </div>
          )}

          {isError && (
            <div className="flex items-center gap-2 text-xs text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>Eve 연결 오류</span>
            </div>
          )}

          {!isLoading && !isError && (
            <>
              {high.length > 0 && (
                <section>
                  <div className="hud-label mb-2 text-rose-400">PRIORITY ALERTS</div>
                  <div className="space-y-2">
                    {high.map(p => (
                      <div key={p.id} className="border border-rose-500/20 bg-rose-500/[0.04] px-3 py-2.5">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
                          <span className="text-[11px] leading-snug text-foreground">{p.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {mid.length > 0 && (
                <section>
                  <div className="hud-label mb-2 text-amber-400">ACTIVE TRACKS</div>
                  <div className="space-y-2">
                    {mid.slice(0, 3).map(p => (
                      <div key={p.id} className="flex items-start gap-2 border border-amber-400/10 bg-amber-400/[0.03] px-3 py-2.5">
                        <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
                        <span className="text-[11px] leading-snug text-muted-foreground">{p.title}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {handoff && handoff.nextActions.length > 0 && (
                <section>
                  <div className="hud-label mb-2 flex items-center gap-1 text-blue-400">
                    <ClipboardList className="h-3 w-3" />
                    NEXT ACTIONS
                    {handoff.date && <span className="ml-auto normal-case text-[9px] text-muted-foreground">{handoff.date}</span>}
                  </div>
                  <div className="space-y-2">
                    {handoff.nextActions.slice(0, 3).map((action, i) => (
                      <div key={i} className="flex items-start gap-2 border border-blue-400/10 bg-blue-400/[0.03] px-3 py-2.5">
                        <span className="hud-mono mt-0.5 shrink-0 text-[11px] text-blue-400">&gt;&gt;</span>
                        <span className="text-[11px] leading-snug text-muted-foreground">{action}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {handoff && handoff.eveSuggestions.length > 0 && (
                <section>
                  <div className="hud-label mb-2 flex items-center gap-1 text-amber-300">
                    <Lightbulb className="h-3 w-3" />
                    EVE SUGGESTIONS
                  </div>
                  <div className="space-y-2">
                    {handoff.eveSuggestions.slice(0, 2).map((s, i) => (
                      <div key={i} className="flex items-start gap-2 border border-amber-300/10 bg-amber-300/[0.03] px-3 py-2.5">
                        <span className="mt-0.5 shrink-0 text-[11px] text-amber-300">•</span>
                        <span className="text-[11px] leading-snug text-muted-foreground">{s}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {pending.length === 0 && (!handoff || handoff.nextActions.length === 0) && (
                <div className="flex flex-col items-center justify-center gap-2 py-8">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  <span className="hud-mono text-[11px] tracking-[0.14em] text-muted-foreground">NO OPEN LOOPS</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#2a3040] bg-white/[0.02] px-4 py-2">
          <span className="hud-mono text-[9px] text-muted-foreground">PENDING {pending.length}</span>
          <a
            href={process.env.NEXT_PUBLIC_MC_URL ?? 'https://eveos.one'}
            target="_blank"
            rel="noopener noreferrer"
            className="hud-mono min-h-[44px] inline-flex items-center text-[9px] text-blue-400 transition-colors hover:text-blue-300"
          >
            OPEN MC
          </a>
        </div>
      </div>
    </div>
  )
}
