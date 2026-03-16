'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Timer, Play, Pause, RotateCcw, Clock, Zap, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FocusSession, SessionType } from '@/types'

const SESSION_PRESETS: { type: SessionType; label: string; minutes: number; color: string }[] = [
  { type: 'pomodoro_25', label: '25min', minutes: 25, color: '#00d4aa' },
  { type: 'focus_90', label: '90min', minutes: 90, color: '#f59e0b' },
  { type: 'deep_work', label: 'Deep Work', minutes: 120, color: '#7c5cbf' },
]

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function FocusPage() {
  const queryClient = useQueryClient()
  const [selectedType, setSelectedType] = useState<SessionType>('pomodoro_25')
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const preset = SESSION_PRESETS.find(p => p.type === selectedType) ?? SESSION_PRESETS[0]
  const totalSeconds = preset.minutes * 60
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100

  const { data: sessions = [] } = useQuery({
    queryKey: ['focus-sessions'],
    queryFn: async (): Promise<FocusSession[]> => {
      const res = await fetch('/api/logs/focus')
      return res.json()
    },
  })

  const createSession = useMutation({
    mutationFn: async (data: Partial<FocusSession>) => {
      const res = await fetch('/api/logs/focus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-sessions'] })
    },
  })

  const saveSession = useCallback((completed: boolean) => {
    if (!startedAt) return
    const elapsed = totalSeconds - timeLeft
    createSession.mutate({
      session_type: selectedType,
      duration_minutes: Math.round(elapsed / 60),
      completed,
      started_at: startedAt,
      date: new Date().toISOString().slice(0, 10),
    })
  }, [startedAt, totalSeconds, timeLeft, selectedType, createSession])

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, timeLeft])

  // Auto-save on completion
  useEffect(() => {
    if (timeLeft === 0 && startedAt) {
      saveSession(true)
      setStartedAt(null)
    }
  }, [timeLeft, startedAt, saveSession])

  const handleStart = () => {
    if (!isRunning && timeLeft === totalSeconds) {
      setStartedAt(new Date().toISOString())
    }
    setIsRunning(true)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    if (isRunning || (startedAt && timeLeft < totalSeconds)) {
      saveSession(false)
    }
    setIsRunning(false)
    setTimeLeft(totalSeconds)
    setStartedAt(null)
  }

  const handleTypeChange = (type: SessionType) => {
    if (isRunning) return
    setSelectedType(type)
    const p = SESSION_PRESETS.find(p => p.type === type)
    if (p) setTimeLeft(p.minutes * 60)
  }

  // Stats
  const today = new Date().toISOString().slice(0, 10)
  const todaySessions = sessions.filter(s => s.date === today || s.started_at?.startsWith(today))
  const todayMinutes = todaySessions.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0)
  const completedCount = todaySessions.filter(s => s.completed).length
  const recentSessions = [...sessions]
    .sort((a, b) => (b.started_at ?? '').localeCompare(a.started_at ?? ''))
    .slice(0, 10)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">포커스</h1>
          <p className="text-sm text-muted-foreground mt-1">Deep Work 타이머로 몰입 세션 기록</p>
        </div>
      </div>

      {/* Timer */}
      <Card className="mb-6">
        <CardContent className="py-8">
          <div className="flex flex-col items-center">
            {/* Session Type Selector */}
            <div className="flex items-center gap-2 mb-8">
              {SESSION_PRESETS.map(p => (
                <button
                  key={p.type}
                  onClick={() => handleTypeChange(p.type)}
                  disabled={isRunning}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    selectedType === p.type
                      ? 'text-black'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  )}
                  style={selectedType === p.type ? { backgroundColor: p.color } : undefined}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Circular Timer */}
            <div className="relative w-64 h-64 mb-8">
              <svg className="w-64 h-64 -rotate-90" viewBox="0 0 256 256">
                <circle cx="128" cy="128" r="112" fill="none" stroke="currentColor" className="text-muted" strokeWidth="6" />
                <circle
                  cx="128" cy="128" r="112" fill="none"
                  stroke={preset.color}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 112}`}
                  strokeDashoffset={`${2 * Math.PI * 112 * (1 - progress / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold font-mono text-foreground">
                  {formatTime(timeLeft)}
                </span>
                <span className="text-sm text-muted-foreground mt-2">{preset.label}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={handleReset}
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                className="h-16 w-16 rounded-full"
                style={{ backgroundColor: preset.color }}
                onClick={isRunning ? handlePause : handleStart}
              >
                {isRunning
                  ? <Pause className="w-7 h-7 text-black" />
                  : <Play className="w-7 h-7 text-black ml-1" />
                }
              </Button>
              <div className="w-12" /> {/* spacer */}
            </div>

            {timeLeft === 0 && (
              <div className="mt-6 text-center animate-in fade-in">
                <Trophy className="w-8 h-8 text-gatsaeng-amber mx-auto mb-2" />
                <p className="text-sm font-medium text-gatsaeng-amber">세션 완료!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Today Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="py-4 text-center">
            <Clock className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold text-foreground">{todayMinutes}</div>
            <div className="text-xs text-muted-foreground">오늘 집중 (분)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <Trophy className="w-5 h-5 mx-auto mb-1 text-gatsaeng-amber" />
            <div className="text-2xl font-bold text-foreground">{completedCount}</div>
            <div className="text-xs text-muted-foreground">완료 세션</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <Zap className="w-5 h-5 mx-auto mb-1 text-gatsaeng-teal" />
            <div className="text-2xl font-bold text-foreground">{todaySessions.length}</div>
            <div className="text-xs text-muted-foreground">총 세션</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">최근 세션</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentSessions.map(session => {
                const sp = SESSION_PRESETS.find(p => p.type === session.session_type)
                return (
                  <div key={session.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: sp?.color ?? '#888' }}
                      />
                      <div>
                        <div className="text-sm font-medium">{sp?.label ?? session.session_type}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {session.started_at?.slice(0, 16).replace('T', ' ')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{session.duration_minutes}분</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px]',
                          session.completed
                            ? 'border-gatsaeng-teal/30 text-gatsaeng-teal'
                            : 'border-gatsaeng-red/30 text-gatsaeng-red'
                        )}
                      >
                        {session.completed ? '완료' : '중단'}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
