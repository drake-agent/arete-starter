'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Task } from '@/types'

interface CalendarViewProps {
  tasks: Task[]
  onClickTask?: (task: Task) => void
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

const MONTH_NAMES = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월',
]

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

const STATUS_DOT: Record<string, string> = {
  backlog: 'bg-muted-foreground',
  todo: 'bg-primary',
  doing: 'bg-gatsaeng-amber',
  done: 'bg-gatsaeng-teal',
}

export function CalendarView({ tasks, onClickTask }: CalendarViewProps) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const prev = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const next = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {}
    tasks.forEach(task => {
      if (task.due_date) {
        const dateStr = task.due_date.slice(0, 10)
        if (!map[dateStr]) map[dateStr] = []
        map[dateStr].push(task)
      }
    })
    return map
  }, [tasks])

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={prev} className="h-8 w-8">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium">
          {year}년 {MONTH_NAMES[month]}
        </span>
        <Button variant="ghost" size="icon" onClick={next} className="h-8 w-8">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border rounded-sm overflow-hidden">
        {DAY_NAMES.map(day => (
          <div key={day} className="bg-secondary/30 px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}

        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-card/50 min-h-[80px]" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayTasks = tasksByDate[dateStr] || []
          const isToday = dateStr === todayStr

          return (
            <div
              key={day}
              className={`bg-card min-h-[80px] p-1.5 ${
                isToday ? 'ring-1 ring-primary ring-inset' : ''
              }`}
            >
              <div className={`text-xs mb-1 ${
                isToday ? 'text-primary font-bold' : 'text-muted-foreground'
              }`}>
                {day}
              </div>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map(task => (
                  <button
                    key={task.id}
                    onClick={() => onClickTask?.(task)}
                    className="w-full text-left flex items-center gap-1 px-1 py-0.5 rounded text-[10px] hover:bg-secondary/50 transition-colors truncate"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[task.status]}`} />
                    <span className="truncate">{task.title}</span>
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-[10px] text-muted-foreground px-1">
                    +{dayTasks.length - 3}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Tasks without due dates */}
      {tasks.filter(t => !t.due_date).length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-muted-foreground mb-2">마감일 미설정</div>
          <div className="flex flex-wrap gap-1">
            {tasks.filter(t => !t.due_date).map(task => (
              <Badge
                key={task.id}
                variant="outline"
                className="text-[10px] cursor-pointer hover:bg-secondary/50"
                onClick={() => onClickTask?.(task)}
              >
                {task.title}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
