'use client'

import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiFetch'
import type { Milestone, MilestoneWithDDay } from '@/types'

export function useMilestones(goalId?: string) {
  return useQuery({
    queryKey: ['milestones', goalId],
    queryFn: () => {
      const url = goalId ? `/api/milestones?goal_id=${goalId}` : '/api/milestones'
      return apiFetch<Milestone[]>(url)
    },
  })
}

export function useMilestonesWithDDay(goalId?: string) {
  const query = useMilestones(goalId)

  const withDDay = useMemo(() =>
    (query.data ?? [])
      .map(m => ({
        ...m,
        d_day: Math.ceil(
          (new Date(m.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        ),
      }))
      .sort((a, b) => a.d_day - b.d_day),
    [query.data]
  )

  return { ...query, data: withDDay }
}

export function useCreateMilestone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Milestone>) =>
      apiFetch<Milestone>('/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] })
    },
  })
}

export function useUpdateMilestone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Milestone> & { id: string }) =>
      apiFetch<Milestone>(`/api/milestones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] })
    },
  })
}

export function useDeleteMilestone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/milestones/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] })
    },
  })
}
