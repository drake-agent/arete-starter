'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Briefcase,
  Zap,
  CalendarDays,
  Mic,
  MoreHorizontal,
  X,
  DollarSign,
  Users,
  Compass,
  Leaf,
  BookOpen,
  Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: '대시', icon: Home, color: '#60a5fa' },
  { href: '/work', label: 'Work', icon: Briefcase, color: '#3b82f6' },
  { href: '/energy', label: 'Energy', icon: Zap, color: '#f59e0b' },
  { href: '/calendar', label: '캘린더', icon: CalendarDays, color: '#60a5fa' },
  { href: '/voice', label: 'Eve', icon: Mic, color: '#8b5cf6' },
]

const MORE_ITEMS = [
  { href: '/finance', label: 'Finance', icon: DollarSign, color: '#10b981' },
  { href: '/relationship', label: 'Relation', icon: Users, color: '#f43f5e' },
  { href: '/meaning', label: 'Meaning', icon: Compass, color: '#8b5cf6' },
  { href: '/lifestyle', label: 'Life', icon: Leaf, color: '#14b8a6' },
  { href: '/meetings', label: '미팅', icon: Layers, color: '#60a5fa' },
  { href: '/playbooks', label: 'Playbook', icon: BookOpen, color: '#60a5fa' },
]

function isNavActive(href: string, pathname: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setMoreOpen(false)}>
          <div
            className="absolute left-0 right-0 border-t border-[#2a3040] bg-[#0a0e1a] px-4 py-3 hud-grid-bg"
            style={{ bottom: 'calc(72px + env(safe-area-inset-bottom))' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="hud-label">나머지 축</span>
              <button onClick={() => setMoreOpen(false)} className="flex min-h-[44px] min-w-[44px] items-center justify-center text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MORE_ITEMS.map(item => {
                const Icon = item.icon
                const isActive = isNavActive(item.href, pathname)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className="flex min-h-[64px] flex-col items-center justify-center gap-1 border px-2 py-2 text-[10px] transition-colors"
                    style={{
                      borderRadius: '2px',
                      color: isActive ? item.color : '#94a3b8',
                      background: isActive ? `${item.color}12` : '#1a1f2e',
                      borderColor: isActive ? `${item.color}55` : '#2a3040',
                      boxShadow: isActive ? `0 0 18px ${item.color}22` : 'none',
                    }}
                  >
                    <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#2a3040] bg-[#0a0e1a]/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid h-[72px] grid-cols-6 items-stretch px-1.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const isActive = isNavActive(item.href, pathname)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-sm px-1 py-2 text-[10px] transition-all"
                style={{
                  color: isActive ? item.color : '#94a3b8',
                  background: isActive ? `${item.color}10` : 'transparent',
                }}
              >
                {isActive && (
                  <>
                    <div className="absolute left-1/2 top-1 -translate-x-1/2 h-[2px] w-8 rounded-full" style={{ background: item.color, boxShadow: `0 0 14px ${item.color}` }} />
                    <div className="absolute inset-1 rounded-sm" style={{ boxShadow: `inset 0 0 18px ${item.color}18, 0 0 14px ${item.color}12` }} />
                  </>
                )}
                <Icon className={cn('relative h-5 w-5', isActive && 'stroke-[2.5]')} />
                <span className="relative hud-mono text-[9px] tracking-[0.08em]">{item.label}</span>
              </Link>
            )
          })}

          <button
            onClick={() => setMoreOpen(v => !v)}
            className={cn(
              'flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-sm px-1 py-2 text-[10px] transition-all',
              moreOpen ? 'text-blue-400' : 'text-muted-foreground'
            )}
          >
            <MoreHorizontal className={cn('h-5 w-5', moreOpen && 'stroke-[2.5]')} />
            <span className="hud-mono text-[9px] tracking-[0.08em]">더보기</span>
          </button>
        </div>
      </nav>
    </>
  )
}
