import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiFetch'
import type { Task } from '@/types'

export function useGlobalTasks(view?: string, sort?: string) {
  return useQuery({
    queryKey: ['tasks', 'global', view, sort],
    queryFn: () => {
      const params = new URLSearchParams()
      if (view) params.set('view', view)
      if (sort) params.set('sort', sort)
      return apiFetch<Task[]>(`/api/tasks?${params}`)
    },
  })
}

export function useQuickCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { title: string; project_id?: string; due_date?: string; priority?: string }) =>
      apiFetch<Task>('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, status: 'todo' }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useToggleTaskDone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, currentStatus }: { id: string; currentStatus: string }) =>
      apiFetch<Task>(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: currentStatus === 'done' ? 'todo' : 'done' }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
