'use client'

import { useEffect, useRef } from 'react'
import { WidgetWrapper } from './WidgetWrapper'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Timer, Play, Pause, RotateCcw } from 'lucide-react'
import { useTimerStore } from '@/stores/timerStore'
import { cn } from '@/lib/utils'
import type { SessionType } from '@/types'

const SESSION_LABELS: Record<SessionType, string> = {
  pomodoro_25: '25분',
  focus_90: '90분 딥워크',
  deep_work: '커스텀',
}

export function FocusTimer() {
  const seconds = useTimerStore(s => s.seconds)
  const isRunning = useTimerStore(s => s.isRunning)
  const sessionType = useTimerStore(s => s.sessionType)
  const completedSessions = useTimerStore(s => s.completedSessions)
  const customMinutes = useTimerStore(s => s.customMinutes)
  const start = useTimerStore(s => s.start)
  const pause = useTimerStore(s => s.pause)
  const reset = useTimerStore(s => s.reset)
  const tick = useTimerStore(s => s.tick)
  const setSessionType = useTimerStore(s => s.setSessionType)
  const setCustomMinutes = useTimerStore(s => s.setCustomMinutes)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(tick, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, tick])

  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60

  return (
    <WidgetWrapper title="포커스 타이머" icon={<Timer className="w-4 h-4" />} widgetId="timer">
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2">
          {(Object.keys(SESSION_LABELS) as SessionType[]).map(type => (
            <Badge
              key={type}
              variant={sessionType === type ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer text-xs',
                sessionType === type && 'bg-gatsaeng-purple text-white'
              )}
              onClick={() => setSessionType(type)}
            >
              {SESSION_LABELS[type]}
            </Badge>
          ))}
        </div>

        {sessionType === 'deep_work' && !isRunning && seconds === customMinutes * 60 && (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={customMinutes}
              onChange={e => setCustomMinutes(Number(e.target.value))}
              className="w-20 h-8 text-center text-sm"
              min={1}
              max={180}
            />
            <span className="text-xs text-muted-foreground">분</span>
          </div>
        )}

        <div className="text-4xl font-mono font-bold text-gatsaeng-purple tabular-nums">
          {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant={isRunning ? 'outline' : 'default'}
            onClick={isRunning ? pause : start}
            className={cn(!isRunning && 'bg-gatsaeng-purple hover:bg-gatsaeng-purple/80')}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button size="sm" variant="outline" onClick={reset}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {completedSessions > 0 && (
          <span className="text-xs text-muted-foreground">
            완료 세션: {completedSessions}
          </span>
        )}
      </div>
    </WidgetWrapper>
  )
}
