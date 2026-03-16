'use client'

import { useMilestonesWithDDay } from '@/hooks/useMilestones'
import { useGoals } from '@/hooks/useGoals'
import { WidgetWrapper } from './WidgetWrapper'
import { Calendar, Target } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

function formatDDay(d: number) {
  if (d === 0) return 'D-Day'
  if (d > 0) return `D-${d}`
  return `D+${Math.abs(d)}`
}

function ddayColor(d: number) {
  if (d <= 0) return 'text-gatsaeng-red'
  if (d <= 7) return 'text-gatsaeng-red'
  if (d <= 30) return 'text-gatsaeng-amber'
  return 'text-foreground'
}

export function DdayWidget() {
  const { data: milestones = [], isLoading } = useMilestonesWithDDay()
  const { data: goals = [] } = useGoals()

  const active = milestones.filter(m => m.status === 'active').slice(0, 5)

  const goalMap = new Map(goals.map(g => [g.id, g]))

  return (
    <WidgetWrapper title="D-day 트래커" icon={<Calendar className="w-4 h-4 text-gatsaeng-red" />}>
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-10 bg-muted/30 rounded animate-pulse" />)}
        </div>
      ) : active.length === 0 ? (
        <p className="text-sm text-muted-foreground">활성 마일스톤이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {active.map(m => {
            const goal = goalMap.get(m.goal_id)
            const progress = m.target_value > 0
              ? Math.min(100, Math.round((m.current_value / m.target_value) * 100))
              : 0
            return (
              <Link
                key={m.id}
                href={`/goals/${m.goal_id}`}
                className="flex items-center gap-3 group"
              >
                <div className={`text-lg font-bold font-mono min-w-[60px] text-right ${ddayColor(m.d_day)}`}>
                  {formatDDay(m.d_day)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {m.title}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {goal && (
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3" style={{ color: goal.color }} />
                        <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{goal.title}</span>
                      </div>
                    )}
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      {progress}%
                    </Badge>
                  </div>
                </div>
                {/* mini progress bar */}
                <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: goal?.color ?? '#58a6ff',
                    }}
                  />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </WidgetWrapper>
  )
}
