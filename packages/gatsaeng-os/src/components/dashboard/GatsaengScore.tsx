'use client'

import { useQuery } from '@tanstack/react-query'
import { WidgetWrapper } from './WidgetWrapper'
import { Zap } from 'lucide-react'
import type { Profile } from '@/types'

export function GatsaengScore() {
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async (): Promise<Profile> => {
      const res = await fetch('/api/profile')
      return res.json()
    },
  })

  return (
    <WidgetWrapper title="갓생 스코어" icon={<Zap className="w-4 h-4 text-gatsaeng-amber" />}>
      <div className="flex items-center gap-4">
        <div className="text-3xl font-bold font-mono text-gatsaeng-amber">
          {profile?.total_score ?? 0}
        </div>
        <div className="text-sm text-muted-foreground">
          <div>Lv. {profile?.level ?? 1}</div>
          <div>연속 {profile?.current_streak ?? 0}일</div>
        </div>
      </div>
    </WidgetWrapper>
  )
}
