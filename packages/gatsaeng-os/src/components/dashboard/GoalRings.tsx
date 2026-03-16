'use client'

import { WidgetWrapper } from './WidgetWrapper'
import { Target } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useGoals } from '@/hooks/useGoals'

const DEFAULT_RING_COLOR = '#58a6ff'
const VALID_COLOR_RE = /^#[0-9a-fA-F]{3,8}$|^(rgb|hsl)/

function RingChart({ progress, color, size = 60 }: { progress: number; color: string; size?: number }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference
  const safeColor = VALID_COLOR_RE.test(color) ? color : DEFAULT_RING_COLOR

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={4}
        className="text-muted/30"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={safeColor}
        strokeWidth={4}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500"
      />
    </svg>
  )
}

export function GoalRings() {
  const { data: goals, isLoading } = useGoals()

  const activeGoals = (goals ?? []).filter(g => g.status === 'active')

  if (isLoading) {
    return (
      <WidgetWrapper title="목표 진척률" icon={<Target className="w-4 h-4" />}>
        <div className="flex gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-16 h-16 rounded-full bg-muted animate-pulse" />
          ))}
        </div>
      </WidgetWrapper>
    )
  }

  return (
    <WidgetWrapper title="목표 진척률" icon={<Target className="w-4 h-4" />}>
      {activeGoals.length === 0 ? (
        <p className="text-sm text-muted-foreground">목표를 추가해보세요</p>
      ) : (
        <div className="flex flex-wrap gap-4">
          {activeGoals.map(goal => {
            const progress = goal.target_value
              ? Math.round(((goal.current_value ?? 0) / goal.target_value) * 100)
              : 0

            return (
              <Tooltip key={goal.id}>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center gap-1 cursor-pointer">
                    <div className="relative">
                      <RingChart progress={progress} color={goal.color} />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-mono">
                        {progress}%
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground max-w-[70px] truncate">
                      {goal.title}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-medium">{goal.title}</p>
                  {goal.why_statement && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Why: {goal.why_statement}
                    </p>
                  )}
                  {goal.target_value && (
                    <p className="text-xs mt-1">
                      {goal.current_value ?? 0} / {goal.target_value} {goal.unit}
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      )}
    </WidgetWrapper>
  )
}
