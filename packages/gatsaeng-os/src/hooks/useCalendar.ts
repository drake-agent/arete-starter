'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiFetch'
import type { CalendarEvent } from '@/types'

export function useCalendarEvents(weekStart?: string, weekEnd?: string) {
  return useQuery({
    queryKey: ['calendar', weekStart, weekEnd],
    queryFn: () => {
      const params = new URLSearchParams()
      if (weekStart) params.set('week_start', weekStart)
      if (weekEnd) params.set('week_end', weekEnd)
      return apiFetch<CalendarEvent[]>(`/api/calendar?${params}`)
    },
    enabled: !!weekStart && !!weekEnd,
  })
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<CalendarEvent>) =>
      apiFetch<CalendarEvent>('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
    },
  })
}

export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<CalendarEvent> & { id: string }) =>
      apiFetch<CalendarEvent>(`/api/calendar/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
    },
  })
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/calendar/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
    },
  })
}
