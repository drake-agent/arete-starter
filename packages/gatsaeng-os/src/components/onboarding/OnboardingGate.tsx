'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { OnboardingFlow } from './OnboardingFlow'
import type { Profile } from '@/types'

const PEAK_HOURS_MAP: Record<string, number[]> = {
  early: [5, 6, 7, 8],
  morning: [9, 10, 11, 12],
  afternoon: [13, 14, 15, 16, 17],
  night: [22, 23, 0, 1, 2],
}

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async (): Promise<Profile | null> => {
      const res = await fetch('/api/profile')
      if (!res.ok) return null
      return res.json()
    },
  })

  const setupProfile = useMutation({
    mutationFn: async (data: {
      display_name: string
      identity: string
      core_value: string
      peak_hours: string
      first_goal: string
    }) => {
      // Update profile
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: data.display_name,
          peak_hours: PEAK_HOURS_MAP[data.peak_hours] || [9, 10, 11],
        }),
      })

      // Create first goal
      if (data.first_goal) {
        await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: data.first_goal,
            type: 'quarterly',
            core_value: data.core_value,
            identity_statement: `나는 ${data.identity} 사람이다`,
          }),
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gatsaeng-amber border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Show onboarding if profile has default name (never customized)
  if (profile && profile.display_name === 'User') {
    return <OnboardingFlow onComplete={(data) => setupProfile.mutate(data)} />
  }

  return <>{children}</>
}
