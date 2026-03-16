'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GripVertical, Calendar as CalendarIcon, Sparkles, Check } from 'lucide-react'
import type { Task } from '@/types'
import { forwardRef, useEffect, useRef, useState } from 'react'

const LS_KEY = 'mc_delegated_task_ids'

function loadDelegated(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(LS_KEY) ?? '[]'))
  } catch {
    return new Set()
  }
}

function markDelegated(taskId: string) {
  try {
    const s = loadDelegated()
    s.add(taskId)
    localStorage.setItem(LS_KEY, JSON.stringify([...s]))
  } catch { /* ignore */ }
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'border-gatsaeng-red text-gatsaeng-red',
  high: 'border-gatsaeng-amber text-gatsaeng-amber',
  medium: 'border-primary text-primary',
  low: 'border-muted-foreground text-muted-foreground',
}

const ENERGY_LABELS: Record<string, string> = {
  high: '⚡ High',
  medium: '🔋 Med',
  low: '🪫 Low',
}

interface TaskCardProps {
  task: Task
  onClick?: () => void
  isDragging?: boolean
  dragHandleProps?: Record<string, unknown>
  style?: React.CSSProperties
}

export const TaskCard = forwardRef<HTMLDivElement, TaskCardProps>(
  function TaskCard({ task, onClick, isDragging, dragHandleProps, style }, ref) {
    const [delegateState, setDelegateState] = useState<'idle' | 'loading' | 'done' | 'error'>(
      () => typeof window !== 'undefined' && loadDelegated().has(task.id) ? 'done' : 'idle'
    )
    const errorTimerRef = useRef<ReturnType<typeof setTimeout>>(null)

    useEffect(() => {
      return () => { if (errorTimerRef.current) clearTimeout(errorTimerRef.current) }
    }, [])

    async function handleDelegate(e: React.MouseEvent) {
      e.stopPropagation()
      if (delegateState === 'done' || delegateState === 'loading') return
      setDelegateState('loading')
      try {
        const res = await fetch('/api/delegate-to-mc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: task.id,
            title: task.title,
            description: task.description ?? '',
            priority: task.priority,
          }),
        })
        if (!res.ok) throw new Error('delegate failed')
        markDelegated(task.id)
        setDelegateState('done')
      } catch {
        setDelegateState('error')
        errorTimerRef.current = setTimeout(() => setDelegateState('idle'), 1500)
      }
    }

    return (
      <div ref={ref} style={style}>
        <Card
          className={`transition-colors cursor-pointer ${
            isDragging ? 'opacity-50 border-primary' : 'hover:border-primary/30'
          }`}
          onClick={onClick}
        >
          <CardContent className="py-3 px-3">
            <div className="flex items-start gap-2">
              {dragHandleProps && (
                <button {...dragHandleProps} className="mt-0.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm text-foreground">{task.title}</div>
                {task.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                )}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${PRIORITY_COLORS[task.priority]}`}>
                    {task.priority}
                  </Badge>
                  {task.energy_required && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {ENERGY_LABELS[task.energy_required]}
                    </Badge>
                  )}
                  {task.tag && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {task.tag}
                    </Badge>
                  )}
                </div>
                {task.due_date && (
                  <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
                    <CalendarIcon className="w-3 h-3" />
                    {task.due_date.slice(0, 10)}
                  </div>
                )}
                <div className="flex justify-end mt-1.5">
                  <button
                    onClick={handleDelegate}
                    disabled={delegateState === 'done' || delegateState === 'loading'}
                    className={`flex items-center gap-0.5 text-[10px] transition-colors ${
                      delegateState === 'done'
                        ? 'text-green-500'
                        : delegateState === 'error'
                          ? 'text-gatsaeng-red'
                          : 'text-muted-foreground hover:text-gatsaeng-purple'
                    } disabled:cursor-default`}
                  >
                    {delegateState === 'done' ? (
                      <><Check className="w-3 h-3" /> MC 위임됨</>
                    ) : delegateState === 'error' ? (
                      '위임 실패'
                    ) : delegateState === 'loading' ? (
                      <><Sparkles className="w-3 h-3 animate-pulse" /> 위임 중…</>
                    ) : (
                      <><Sparkles className="w-3 h-3" /> Eve 위임</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
)
