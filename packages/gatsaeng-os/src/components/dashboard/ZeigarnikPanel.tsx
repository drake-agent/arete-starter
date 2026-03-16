'use client'

import { AlertCircle } from 'lucide-react'
import { useRoutines } from '@/hooks/useRoutines'
import { useTasks } from '@/hooks/useProjects'

export function ZeigarnikPanel() {
  const { routines } = useRoutines()
  const { data: allTasks } = useTasks()

  const incompleteRoutines = routines.filter(r => !r.completed_today)
  const urgentTasks = (allTasks ?? []).filter(
    t => t.status !== 'done' && (t.priority === 'urgent' || t.priority === 'high')
  )

  const totalIncomplete = incompleteRoutines.length + urgentTasks.length

  if (totalIncomplete === 0) {
    return (
      <div className="w-full flex items-center justify-center p-4 text-center">
        <div>
          <div className="text-2xl mb-1">&#10003;</div>
          <p className="text-xs text-muted-foreground">모두 완료!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-gatsaeng-red/10 border border-gatsaeng-red/30 rounded-lg px-4 py-3 flex items-center gap-3">
      <AlertCircle className="w-4 h-4 text-gatsaeng-red shrink-0" />
      <span className="text-sm text-foreground">
        <strong className="text-gatsaeng-red">{totalIncomplete}개</strong>의 미완성 항목이 기다리고 있습니다
        {incompleteRoutines.length > 0 && (
          <span className="text-muted-foreground"> — 루틴 {incompleteRoutines.length}개</span>
        )}
        {urgentTasks.length > 0 && (
          <span className="text-muted-foreground"> — 긴급 태스크 {urgentTasks.length}개</span>
        )}
      </span>
    </div>
  )
}
