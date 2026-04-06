'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiFetch'
import type { Book } from '@/types'

export function useBook(id: string) {
  return useQuery({
    queryKey: ['book', id],
    queryFn: () => apiFetch<Book & { _content?: string }>(`/api/books/${id}`),
    enabled: !!id,
  })
}

export function useBooks(enabled = true) {
  return useQuery({
    queryKey: ['books'],
    queryFn: () => apiFetch<Book[]>('/api/books'),
    enabled,
  })
}

export function useCreateBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Book>) =>
      apiFetch<Book>('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}

export function useUpdateBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Book> & { id: string; content?: string }) =>
      apiFetch<Book>(`/api/books/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      if (variables.id) queryClient.invalidateQueries({ queryKey: ['book', variables.id] })
    },
  })
}

export function useDeleteBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/books/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}
