'use client'

import { useQuery } from '@tanstack/react-query'
import { AlertCircle, CheckCircle2, Sparkles, ClipboardList, Lightbulb } from 'lucide-react'
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

export function EveCard() {
  const { data, isLoading, isError, dataUpdatedAt } = useQuery<EveCardData>({
    queryKey: ['cockpit-eve'],
    queryFn: () => apiFetch<EveCardData>('/api/cockpit/eve'),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  })

  if (isLoading) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <div className="animate-pulse text-xs text-muted-foreground">Eve 로딩 중...</div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Eve 연결 오류</p>
        </div>
      </div>
    )
  }

  const pending: PendingItem[] = data?.pending || []
  const high = pending.filter(p => p.priority?.includes('🔴'))
  const mid = pending.filter(p => p.priority?.includes('🟡'))
  const handoff: HandoffData | null = data?.handoff || null

  // Show fetch timestamp instead of stale render time
  const updatedTime = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div className="p-4 h-full flex flex-col gap-3 overflow-auto">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-gatsaeng-purple" />
        <span className="text-xs font-semibold text-gatsaeng-purple">Eve · 현재 상태</span>
        {updatedTime && (
          <span className="ml-auto text-[10px] text-muted-foreground" title="마지막 업데이트">
            {updatedTime}
          </span>
        )}
      </div>

      {high.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
            🔴 긴급 오픈 루프
          </div>
          <div className="space-y-1">
            {high.map(p => (
              <div key={p.id} className="flex items-start gap-2 text-xs">
                <AlertCircle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                <span className="text-foreground leading-snug">{p.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {mid.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
            🟡 진행 중
          </div>
          <div className="space-y-1">
            {mid.slice(0, 2).map(p => (
              <div key={p.id} className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-3 h-3 text-yellow-400 mt-0.5 shrink-0" />
                <span className="text-muted-foreground leading-snug">{p.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 📋 이어갈 것 — handoff.md에서 파싱 */}
      {handoff && handoff.nextActions.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
            <ClipboardList className="w-3 h-3" />
            이어갈 것
            {handoff.date && (
              <span className="ml-auto normal-case text-[9px]">{handoff.date}</span>
            )}
          </div>
          <div className="space-y-1">
            {handoff.nextActions.map((action, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="text-muted-foreground mt-0.5 shrink-0">→</span>
                <span className="text-muted-foreground leading-snug">{action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 💡 Eve 제안 — handoff 에너지/패턴 메모 기반 */}
      {handoff && handoff.eveSuggestions.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-yellow-500" />
            Eve 제안
          </div>
          <div className="space-y-1">
            {handoff.eveSuggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="text-yellow-500 mt-0.5 shrink-0">•</span>
                <span className="text-muted-foreground leading-snug">{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length === 0 && (!handoff || handoff.nextActions.length === 0) && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">NO OPEN LOOPS</p>
          </div>
        </div>
      )}

      <div className="mt-auto text-[10px] text-muted-foreground border-t border-border pt-2 flex items-center justify-between">
        <span>총 {pending.length}개 Pending</span>
        <a
          href={process.env.NEXT_PUBLIC_MC_URL ?? 'https://eveos.one'}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-muted-foreground hover:text-gatsaeng-purple hover:underline transition-colors"
        >
          MC 대시보드 →
        </a>
      </div>
    </div>
  )
}
