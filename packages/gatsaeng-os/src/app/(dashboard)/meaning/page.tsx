'use client'

import { useQuery } from '@tanstack/react-query'
import { Compass, Target, Clock2, BookOpen, Telescope, Sparkles } from 'lucide-react'
import { HudAxisPage, HudCard, HudDataPending } from '@/components/layout/HudAxisPage'

interface PlaybookCandidate {
  title?: string
  domains?: string[]
  transferability?: string
  context?: string
  [key: string]: unknown
}

const NORTH_STAR = 'Drake에게 먼저 작동하는 삶 설계 시스템을 만들고, 그 작동 원리를 EaaS로 구조화한다.'

export default function MeaningPage() {
  const color = '#8b5cf6'
  const { data: candidates = [], isLoading } = useQuery<PlaybookCandidate[]>({
    queryKey: ['playbooks'],
    queryFn: async () => {
      const res = await fetch('/api/playbooks')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    },
    staleTime: 1000 * 60 * 10,
  })

  const recentCandidates = candidates.slice(0, 3)

  return (
    <HudAxisPage
      title="MEANING"
      subtitle="삶의 방향과 가치를 명확히 하고, 무엇을 위해 사는지 기억한다."
      icon={<Compass className="w-6 h-6" />}
      color={color}
      score={58}
    >
      <HudCard title="NORTH STAR VECTOR" color={color} icon={<Target className="w-4 h-4" />} topRight="MISSION CORE">
        <div className="border p-4" style={{ borderColor: `${color}24`, background: 'rgba(139,92,246,0.08)' }}>
          <div className="hud-label text-purple-300 mb-2">ARETE NORTH STAR</div>
          <p className="text-sm text-foreground leading-relaxed">{NORTH_STAR}</p>
        </div>
      </HudCard>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-4">
        <HudCard title="TIMING WINDOW" color={color} icon={<Clock2 className="w-4 h-4" />}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {['NOW', '30D', '90D'].map((label, i) => (
              <div key={label} className="border px-3 py-3" style={{ borderColor: `${color}22`, background: 'rgba(255,255,255,0.02)' }}>
                <div className="hud-label mb-1" style={{ color }}>{label}</div>
                <div className="hud-mono text-lg text-foreground">{['ALIGN', 'WATCH', 'BUILD'][i]}</div>
              </div>
            ))}
          </div>
          <HudDataPending label="DATA LINK PENDING... TIMING / SAJU / SEASONAL INTEL" />
        </HudCard>

        <HudCard title="INSIGHT FIELD" color={color} icon={<Sparkles className="w-4 h-4" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {['Clarity', 'Conviction', 'Meaning Load', 'Noise Filter'].map(item => (
              <div key={item} className="border px-3 py-3" style={{ borderColor: `${color}22` }}>
                <div className="hud-label mb-1">{item}</div>
                <HudDataPending />
              </div>
            ))}
          </div>
        </HudCard>
      </div>

      <HudCard title="PLAYBOOK SIGNALS" color={color} icon={<BookOpen className="w-4 h-4" />} topRight="TRANSFERABILITY">
        {isLoading && <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted/20 animate-pulse" />)}</div>}
        {!isLoading && recentCandidates.length === 0 && <HudDataPending label="DATA LINK PENDING... PLAYBOOK ARCHIVE" />}
        {!isLoading && recentCandidates.length > 0 && (
          <div className="space-y-2">
            {recentCandidates.map((c, i) => (
              <div key={i} className="border p-3" style={{ borderColor: `${color}20`, background: 'rgba(139,92,246,0.04)' }}>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium">{c.title || `Playbook #${i + 1}`}</div>
                  <span className="hud-label text-purple-300">{(c.transferability as string) || 'READY'}</span>
                </div>
                {c.context && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.context}</p>}
              </div>
            ))}
          </div>
        )}
      </HudCard>

      <HudCard title="LONG RANGE" color={color} icon={<Telescope className="w-4 h-4" />}>
        <HudDataPending label="DATA LINK PENDING... PURPOSE / LEGACY / MAP" />
      </HudCard>
    </HudAxisPage>
  )
}
