'use client'

import { useQuery } from '@tanstack/react-query'

export interface TimingContext {
  month: string
  heavenly_stem: string
  earthly_branch: string
  pillar: string
  rating: number
  theme: string
  insight: string
  action_guide: string[]
  caution?: string[]
}

export function useCurrentTiming() {
  return useQuery({
    queryKey: ['timing', 'current'],
    queryFn: async (): Promise<TimingContext | null> => {
      const res = await fetch('/api/timing/current')
      if (!res.ok) return null
      return res.json()
    },
    staleTime: 1000 * 60 * 60, // 1h — timing doesn't change often
  })
}
