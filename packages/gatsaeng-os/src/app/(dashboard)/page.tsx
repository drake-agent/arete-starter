'use client'

import { useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiFetch'
import { useEffect } from 'react'
import { HudDashboard } from '@/components/dashboard/HudDashboard'

export default function DashboardPage() {
  const queryClient = useQueryClient()
  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ['cockpit-eve'],
      queryFn: () => apiFetch('/api/cockpit/eve'),
      staleTime: 1000 * 60 * 5,
    })
    queryClient.prefetchQuery({
      queryKey: ['life-status'],
      queryFn: () => apiFetch('/api/cockpit/life-status'),
      staleTime: 1000 * 60 * 5,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <HudDashboard />
}
