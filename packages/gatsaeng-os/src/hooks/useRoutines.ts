'use client'

import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiFetch'
import { getToday } from '@/lib/date'
import { buildHabitChain } from '@/lib/neuroscience/habitStack'
import type { Routine, RoutineLog, RoutineWithStatus } from '@/types'

export function useRoutines() {
  const today = getToday()

  const routinesQuery = useQuery({
    queryKey: ['routines'],
    queryFn: () => apiFetch<Routine[]>('/api/routines'),
  })

  const logsQuery = useQuery({
    queryKey: ['routine-logs', today],
    queryFn: () => apiFetch<RoutineLog>(`/api/logs/routine?date=${today}`),
  })

  const routinesWithStatus = useMemo<RoutineWithStatus[]>(() =>
    (routinesQuery.data ?? [])
      .filter(r => r.is_active)
      .map(r => ({
        ...r,
        completed_today: logsQuery.data?.completions?.some(c => c.routine_id === r.id) ?? false,
      })),
    [routinesQuery.data, logsQuery.data]
  )

  const chains = useMemo(() => buildHabitChain(routinesWithStatus), [routinesWithStatus])

  return {
    chains,
    routines: routinesWithStatus,
    isLoading: routinesQuery.isLoading || logsQuery.isLoading,
  }
}

export function useToggleRoutine() {
  const queryClient = useQueryClient()
  const today = getToday()

  return useMutation({
    mutationFn: ({ routineId, completed }: { routineId: string; completed: boolean }) =>
      apiFetch('/api/logs/routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routine_id: routineId, undo: completed, date: today }),
      }),
    onMutate: async ({ routineId, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['routine-logs', today] })
      const prev = queryClient.getQueryData<RoutineLog>(['routine-logs', today])

      queryClient.setQueryData<RoutineLog>(['routine-logs', today], (old) => {
        if (!old) return { date: today, completions: completed ? [] : [{ routine_id: routineId, completed_at: new Date().toISOString() }] }
        return {
          ...old,
          completions: completed
            ? old.completions.filter(c => c.routine_id !== routineId)
            : [...old.completions, { routine_id: routineId, completed_at: new Date().toISOString() }],
        }
      })

      return { prev }
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['routine-logs', today], ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['routine-logs', today] })
    },
  })
}
