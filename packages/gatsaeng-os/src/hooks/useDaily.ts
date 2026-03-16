'use client'

import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiFetch'
import { getToday } from '@/lib/date'
import type { DailyManifest } from '@/types'

export function useDaily(date?: string) {
  const today = date ?? getToday()

  return useQuery({
    queryKey: ['daily', today],
    queryFn: () => apiFetch<DailyManifest>(`/api/daily?date=${today}`),
  })
}
