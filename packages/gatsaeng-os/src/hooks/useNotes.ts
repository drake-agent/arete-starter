import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiFetch'
import type { Note, NoteType } from '@/types'

export function useNote(id: string) {
  return useQuery({
    queryKey: ['note', id],
    queryFn: () => apiFetch<Note & { _content?: string }>(`/api/notes/${id}`),
    enabled: !!id,
  })
}

export function useNotes(type?: NoteType, areaId?: string) {
  return useQuery({
    queryKey: ['notes', type, areaId],
    queryFn: () => {
      const params = new URLSearchParams()
      if (type) params.set('type', type)
      if (areaId) params.set('area_id', areaId)
      return apiFetch<(Note & { _content?: string })[]>(`/api/notes?${params}`)
    },
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Note> & { content?: string }) =>
      apiFetch<Note>('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Note> & { id: string; content?: string }) =>
      apiFetch<Note>(`/api/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      if (variables.id) queryClient.invalidateQueries({ queryKey: ['note', variables.id] })
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/notes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })
}
