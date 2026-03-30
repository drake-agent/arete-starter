'use client'

import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiFetch'
import type { LifeStatusResponse, AxisStatus } from '@/app/api/cockpit/life-status/route'

const STATUS_BADGE: Record<AxisStatus, { label: string; dot: string; text: string }> = {
  good:    { label: '양호', dot: '🟢', text: 'text-emerald-400' },
  normal:  { label: '보통', dot: '🟡', text: 'text-yellow-400' },
  warning: { label: '주의', dot: '🔴', text: 'text-red-400' },
}

export function LifeStatusCard() {
  const { data, isLoading, error } = useQuery<LifeStatusResponse>({
    queryKey: ['life-status'],
    queryFn: () => apiFetch<LifeStatusResponse>('/api/cockpit/life-status'),
    staleTime: 1000 * 60 * 5, // 5 min
    refetchInterval: 1000 * 60 * 10, // 10 min auto-refresh
  })

  if (isLoading) {
    return (
      <div className="space-y-2 p-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-6 bg-muted/30 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-xs text-muted-foreground p-1">데이터를 불러올 수 없습니다.</div>
    )
  }

  return (
    <div className="space-y-1.5">
      {data.axes.map(axis => {
        const badge = STATUS_BADGE[axis.status]
        return (
          <div
            key={axis.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded-sm bg-muted/20 hover:bg-muted/30 transition-colors"
          >
            <span className="text-base w-5 shrink-0">{axis.emoji}</span>
            <span className="text-xs font-medium text-foreground w-24 shrink-0">{axis.label}</span>
            <span className="flex-1 text-xs text-muted-foreground truncate">{axis.summary}</span>
            <span className="flex items-center gap-1 shrink-0">
              <span>{badge.dot}</span>
              <span className={`text-[10px] font-medium ${badge.text}`}>{badge.label}</span>
            </span>
          </div>
        )
      })}
      <div className="text-[9px] text-muted-foreground/50 text-right pr-1 pt-0.5">
        {new Date(data.updatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 기준
      </div>
    </div>
  )
}
