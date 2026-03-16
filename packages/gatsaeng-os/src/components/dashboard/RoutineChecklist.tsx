'use client'

import { WidgetWrapper } from './WidgetWrapper'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { RotateCcw } from 'lucide-react'
import { useRoutines, useToggleRoutine } from '@/hooks/useRoutines'
import { cn } from '@/lib/utils'
import type { RoutineWithStatus } from '@/types'

export function RoutineChecklist() {
  const { chains, isLoading } = useRoutines()
  const toggleMutation = useToggleRoutine()

  const handleToggle = (routine: RoutineWithStatus) => {
    toggleMutation.mutate({
      routineId: routine.id,
      completed: routine.completed_today,
    })
  }

  if (isLoading) {
    return (
      <WidgetWrapper title="오늘의 루틴" icon={<RotateCcw className="w-4 h-4" />}>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </WidgetWrapper>
    )
  }

  return (
    <WidgetWrapper title="오늘의 루틴" icon={<RotateCcw className="w-4 h-4" />}>
      {chains.length === 0 ? (
        <p className="text-sm text-muted-foreground">루틴을 추가해보세요</p>
      ) : (
        <div className="space-y-4">
          {chains.map((chain) => (
            <div key={chain.map(r => r.id).join('-')} className="space-y-1">
              {chain.map((routine, i) => (
                <div
                  key={routine.id}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                    routine.completed_today ? 'bg-gatsaeng-teal/10' : 'hover:bg-card'
                  )}
                >
                  {i > 0 && (
                    <div className="w-4 flex justify-center">
                      <div className="w-px h-3 bg-border -mt-4" />
                    </div>
                  )}
                  <Checkbox
                    checked={routine.completed_today}
                    onCheckedChange={() => handleToggle(routine)}
                  />
                  <span className={cn(
                    'text-sm flex-1',
                    routine.completed_today && 'line-through text-muted-foreground'
                  )}>
                    {routine.title}
                  </span>
                  {routine.trigger_cue && (
                    <span className="text-xs text-muted-foreground">{routine.trigger_cue}</span>
                  )}
                  {routine.streak > 0 && (
                    <Badge variant="outline" className="text-gatsaeng-amber border-gatsaeng-amber/30 text-xs">
                      {routine.streak}일
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </WidgetWrapper>
  )
}
