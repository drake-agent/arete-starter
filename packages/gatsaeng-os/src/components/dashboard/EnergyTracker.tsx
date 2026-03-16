'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { WidgetWrapper } from './WidgetWrapper'
import { Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/apiFetch'
import { getToday } from '@/lib/date'
import type { EnergyLog } from '@/types'

const ENERGY_LEVELS = [
  { value: 1, label: '매우 낮음', color: 'bg-gatsaeng-red' },
  { value: 2, label: '낮음', color: 'bg-orange-500' },
  { value: 3, label: '보통', color: 'bg-yellow-500' },
  { value: 4, label: '높음', color: 'bg-gatsaeng-teal' },
  { value: 5, label: '최고', color: 'bg-green-500' },
]

export function EnergyTracker() {
  const today = getToday()
  const currentHour = new Date().getHours()
  const queryClient = useQueryClient()

  const { data: energyLog } = useQuery({
    queryKey: ['energy-log', today],
    queryFn: () => apiFetch<EnergyLog>(`/api/logs/energy?date=${today}`),
  })

  const logMutation = useMutation({
    mutationFn: (level: number) =>
      apiFetch('/api/logs/energy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today, hour: currentHour, level }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['energy-log', today] })
    },
  })

  const currentEntry = energyLog?.entries?.find(e => e.hour === currentHour)

  return (
    <WidgetWrapper title="에너지 체크" icon={<Zap className="w-4 h-4 text-gatsaeng-amber" />} widgetId="energy">
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          현재 시간: {currentHour}시 — 지금 에너지 레벨은?
        </p>
        <div className="flex gap-2">
          {ENERGY_LEVELS.map(level => (
            <button
              key={level.value}
              onClick={() => logMutation.mutate(level.value)}
              className={cn(
                'w-8 h-8 rounded-full transition-all text-xs font-bold',
                currentEntry?.level === level.value
                  ? `${level.color} text-white scale-110`
                  : 'bg-muted text-muted-foreground hover:scale-105'
              )}
            >
              {level.value}
            </button>
          ))}
        </div>
        {energyLog?.entries && energyLog.entries.length > 0 && (
          <div className="flex gap-1 mt-2">
            {Array.from({ length: 24 }, (_, h) => {
              const entry = energyLog.entries.find(e => e.hour === h)
              return (
                <div
                  key={h}
                  className={cn(
                    'w-2 h-6 rounded-sm',
                    entry
                      ? ENERGY_LEVELS[entry.level - 1]?.color ?? 'bg-muted'
                      : 'bg-muted/30'
                  )}
                  title={`${h}시: ${entry ? `레벨 ${entry.level}` : '미기록'}`}
                />
              )
            })}
          </div>
        )}
      </div>
    </WidgetWrapper>
  )
}
