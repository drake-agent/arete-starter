'use client'

import { useQuery } from '@tanstack/react-query'
import { Users, Baby, Briefcase, CalendarHeart, Clock, Radar, HeartHandshake } from 'lucide-react'
import { FAMILY } from '@/config/family'
import type { Meeting } from '@/types'
import { HudAxisPage, HudCard, HudDataPending } from '@/components/layout/HudAxisPage'

function getAge(birthday: Date): string {
  const now = new Date()
  const months = (now.getFullYear() - birthday.getFullYear()) * 12 + (now.getMonth() - birthday.getMonth())
  if (months < 24) return `${months}개월`
  const years = Math.floor(months / 12)
  const remainMonths = months % 12
  return remainMonths > 0 ? `${years}세 ${remainMonths}개월` : `${years}세`
}

function getDaysUntilBirthday(birthday: Date): number {
  const now = new Date()
  const thisYear = new Date(now.getFullYear(), birthday.getMonth(), birthday.getDate())
  if (thisYear < now) thisYear.setFullYear(thisYear.getFullYear() + 1)
  return Math.ceil((thisYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export default function RelationshipPage() {
  const color = '#f43f5e'
  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
    queryKey: ['meetings'],
    queryFn: async () => {
      const res = await fetch('/api/meetings')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    },
    staleTime: 1000 * 60 * 5,
  })

  const relationshipMeetings = meetings.filter(m => m.domains.includes('Relationship'))

  return (
    <HudAxisPage
      title="RELATIONSHIP"
      subtitle="사람과의 연결을 설계하고, 중요한 관계를 깊게 가꾼다."
      icon={<Users className="w-6 h-6" />}
      color={color}
      score={63}
    >
      <HudCard title="CONTACT FIELD" color={color} icon={<Radar className="w-4 h-4" />} topRight="SOCIAL HUD">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            ['Family', '78'],
            ['Core Network', '64'],
            ['Follow-up', '47'],
          ].map(([label, value]) => (
            <div key={label} className="border px-3 py-4" style={{ borderColor: `${color}28`, background: `${color}08` }}>
              <div className="hud-label mb-1" style={{ color }}>{label}</div>
              <div className="hud-mono text-2xl font-bold text-foreground">{value}</div>
              <div className="mt-2 h-1.5 bg-[#0f1726] border border-white/5 overflow-hidden">
                <div className="h-full" style={{ width: `${value}%`, background: color }} />
              </div>
            </div>
          ))}
        </div>
      </HudCard>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-4">
        <HudCard title="FAMILY STATUS" color={color} icon={<Baby className="w-4 h-4" />}>
          <div className="space-y-3">
            {[
              { label: '와이프', emoji: '💑', ...FAMILY.wife },
              { label: '첫째', emoji: '👶', ...FAMILY.child1 },
              { label: '둘째', emoji: '👶', ...FAMILY.child2 },
            ].map((person) => {
              const age = getAge(person.birthday)
              const dBirthday = getDaysUntilBirthday(person.birthday)
              const bdayStr = `${person.birthday.getMonth() + 1}/${person.birthday.getDate()}`
              return (
                <div key={person.label} className="flex items-center justify-between px-4 py-3 border" style={{ borderColor: `${color}24`, background: 'rgba(244,63,94,0.05)' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{person.emoji}</span>
                    <div>
                      <div className="text-sm font-semibold text-rose-300">{person.label}</div>
                      <div className="text-xs text-muted-foreground">{age}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-rose-300 hud-mono">D-{dBirthday}</div>
                    <div className="text-xs text-muted-foreground">{bdayStr}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </HudCard>

        <div className="grid grid-cols-1 gap-4">
          <HudCard title="BUSINESS RELATION INTEL" color={color} icon={<Briefcase className="w-4 h-4" />}>
            {isLoading && <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-14 bg-muted/20 animate-pulse" />)}</div>}
            {!isLoading && relationshipMeetings.length === 0 && <HudDataPending label="DATA LINK PENDING... RELATIONSHIP MEETING INTEL" />}
            {!isLoading && relationshipMeetings.length > 0 && (
              <div className="space-y-2">
                {relationshipMeetings.map(m => (
                  <div key={m.fileId} className="px-3 py-3 border" style={{ borderColor: 'rgba(42,48,64,0.9)' }}>
                    <div className="text-sm font-medium">{m.title}</div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      {m.date && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{m.date}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </HudCard>

          <HudCard title="CARE QUEUE" color={color} icon={<CalendarHeart className="w-4 h-4" />}>
            <HudDataPending label="DATA LINK PENDING... ANNIVERSARY / FOLLOW-UP / CARE" />
          </HudCard>
        </div>
      </div>

      <HudCard title="WARMTH SIGNAL" color={color} icon={<HeartHandshake className="w-4 h-4" />}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {['Presence', 'Listening', 'Intentional Reachout'].map(item => (
            <div key={item} className="border px-3 py-3" style={{ borderColor: `${color}20` }}>
              <div className="hud-label mb-1">{item}</div>
              <HudDataPending />
            </div>
          ))}
        </div>
      </HudCard>
    </HudAxisPage>
  )
}
