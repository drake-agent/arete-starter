'use client'

import { useCurrentTiming } from '@/hooks/useTiming'
import { WidgetWrapper } from './WidgetWrapper'
import { Compass } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const RATING_LABELS = ['', '주의', '신중', '보통', '유리', '최적']
const RATING_COLORS = ['', 'text-gatsaeng-red', 'text-gatsaeng-amber', 'text-muted-foreground', 'text-gatsaeng-teal', 'text-primary']

export function TimingWidget() {
  const { data: timing, isLoading } = useCurrentTiming()

  if (isLoading) {
    return (
      <WidgetWrapper title="이달의 운기" icon={<Compass className="w-4 h-4 text-gatsaeng-purple" />}>
        <div className="h-24 bg-muted/30 rounded animate-pulse" />
      </WidgetWrapper>
    )
  }

  if (!timing) {
    return (
      <WidgetWrapper title="이달의 운기" icon={<Compass className="w-4 h-4 text-gatsaeng-purple" />}>
        <p className="text-sm text-muted-foreground">타이밍 데이터가 없습니다.</p>
      </WidgetWrapper>
    )
  }

  return (
    <WidgetWrapper title="이달의 운기" icon={<Compass className="w-4 h-4 text-gatsaeng-purple" />}>
      <div className="space-y-3">
        {/* Header: pillar + rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{timing.pillar}</span>
            <span className="text-xs text-muted-foreground">
              {timing.heavenly_stem} {timing.earthly_branch}
            </span>
          </div>
          <Badge
            variant="outline"
            className={`${RATING_COLORS[timing.rating] ?? ''} border-current`}
          >
            {RATING_LABELS[timing.rating] ?? '?'} ({timing.rating}/5)
          </Badge>
        </div>

        {/* Theme */}
        <div className="text-sm">
          <span className="text-muted-foreground">테마:</span>{' '}
          <span className="text-foreground font-medium">{timing.theme}</span>
        </div>

        {/* Insight */}
        <p className="text-xs text-muted-foreground leading-relaxed">{timing.insight}</p>

        {/* Action guide */}
        {timing.action_guide?.length > 0 && (
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">실행 가이드</div>
            {timing.action_guide.map((a, i) => (
              <div key={i} className="text-xs text-foreground flex items-start gap-1.5">
                <span className="text-gatsaeng-teal mt-0.5">•</span>
                {a}
              </div>
            ))}
          </div>
        )}

        {/* Caution */}
        {(timing.caution?.length ?? 0) > 0 && (
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-gatsaeng-amber">주의</div>
            {timing.caution!.map((c, i) => (
              <div key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <span className="text-gatsaeng-amber mt-0.5">!</span>
                {c}
              </div>
            ))}
          </div>
        )}
      </div>
    </WidgetWrapper>
  )
}
