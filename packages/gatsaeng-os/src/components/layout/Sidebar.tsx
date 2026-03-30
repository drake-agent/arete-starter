'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ENTITY_ROUTES } from '@/lib/routes'
import { useFavoritesStore } from '@/stores/favoritesStore'
import { useCockpitStore } from '@/stores/cockpitStore'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiFetch'
import type { LifeStatusResponse, AxisStatus } from '@/app/api/cockpit/life-status/route'
import {
  LayoutDashboard, CalendarDays, BookOpen, LogOut, Star, Plus, Check, X, Mic,
  Zap, Briefcase, Users, DollarSign, Compass, Leaf, BookMarked,
} from 'lucide-react'

const LIFE_DESIGN_ITEMS = [
  { href: '/energy', label: 'Energy', icon: Zap, axisId: 'energy' },
  { href: '/work', label: 'Work', icon: Briefcase, axisId: 'work' },
  { href: '/relationship', label: 'Relationship', icon: Users, axisId: 'relationship' },
  { href: '/finance', label: 'Finance', icon: DollarSign, axisId: 'finance' },
  { href: '/meaning', label: 'Meaning', icon: Compass, axisId: 'meaning' },
  { href: '/lifestyle', label: 'Lifestyle', icon: Leaf, axisId: 'lifestyle' },
] as const

const AXIS_ICON_COLOR: Record<string, string> = {
  energy: '#f59e0b', work: '#3b82f6', relationship: '#f43f5e', finance: '#10b981', meaning: '#8b5cf6', lifestyle: '#14b8a6',
}

const STATUS_DOT: Record<AxisStatus, string> = {
  good: 'status-dot-good', normal: 'status-dot-normal', warning: 'status-dot-warning',
}

const OPERATIONS_ITEMS = [
  { href: '/calendar', label: '캘린더', icon: CalendarDays },
  { href: '/review', label: '계획 & 회고', icon: BookOpen },
  { href: '/playbooks', label: 'Playbooks', icon: BookMarked },
  { href: '/voice', label: 'Eve 보이스', icon: Mic },
] as const

function AreteMark() {
  const colors = ['#f59e0b', '#3b82f6', '#f43f5e', '#10b981', '#8b5cf6', '#14b8a6']
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="2.2" fill="#60a5fa" />
      {colors.map((color, i) => {
        const angle = (-90 + i * 60) * Math.PI / 180
        const x = 11 + Math.cos(angle) * 6.6
        const y = 11 + Math.sin(angle) * 6.6
        return <circle key={color} cx={x} cy={y} r="1.4" fill={color} opacity="0.95" />
      })}
      <path d="M11 1.8 L18.6 6.2 V15.8 L11 20.2 L3.4 15.8 V6.2 Z" stroke="rgba(96,165,250,0.65)" strokeWidth="1" fill="rgba(96,165,250,0.05)" />
    </svg>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const favorites = useFavoritesStore(s => s.favorites)
  const workspaces = useCockpitStore(s => s.workspaces)
  const activeWorkspaceId = useCockpitStore(s => s.activeWorkspaceId)
  const setActiveWorkspace = useCockpitStore(s => s.setActiveWorkspace)
  const addWorkspace = useCockpitStore(s => s.addWorkspace)

  const [addingWs, setAddingWs] = useState(false)
  const [wsName, setWsName] = useState('')
  const wsInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (addingWs) wsInputRef.current?.focus()
  }, [addingWs])

  const { data: lifeStatus } = useQuery<LifeStatusResponse>({
    queryKey: ['life-status'],
    queryFn: () => apiFetch<LifeStatusResponse>('/api/cockpit/life-status'),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 10,
  })

  function getAxisStatus(axisId: string): AxisStatus {
    return lifeStatus?.axes.find(a => a.id === axisId)?.status ?? 'normal'
  }

  const handleAddWorkspace = () => {
    const trimmed = wsName.trim()
    if (trimmed) {
      addWorkspace(trimmed)
      if (pathname !== '/') router.push('/')
    }
    setWsName('')
    setAddingWs(false)
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside className="relative w-14 h-full border-r border-[#233044] bg-[#08101d] flex flex-col overflow-visible">
      <div className="absolute inset-0 hud-grid-bg opacity-[0.14] pointer-events-none" />

      <div className="relative h-14 border-b border-[#233044] flex items-center justify-center shrink-0 bg-white/[0.02]">
        <Link href="/" className="flex items-center justify-center">
          <AreteMark />
        </Link>
      </div>

      <div className="relative flex-1 overflow-y-auto py-2">
        <SidebarIcon href="/" label="Mission Control" isActive={pathname === '/'} accent="#60a5fa">
          <LayoutDashboard className="w-4 h-4" />
        </SidebarIcon>

        <div className="mx-auto w-7 h-px bg-[#233044] my-2" />

        {LIFE_DESIGN_ITEMS.map(item => {
          const Icon = item.icon
          const color = AXIS_ICON_COLOR[item.axisId]
          const st = getAxisStatus(item.axisId)
          const dotCls = STATUS_DOT[st]
          const isActive = pathname === item.href

          return (
            <div key={item.href} className="relative group/item">
              <Link
                href={item.href}
                className={cn('flex items-center justify-center w-full h-10 relative transition-all', isActive ? 'bg-[#101827]' : 'hover:bg-[#0f1726]')}
              >
                {isActive && (
                  <>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
                    <div className="absolute inset-y-1 left-0 w-full opacity-20" style={{ background: `linear-gradient(90deg, ${color}22, transparent 60%)` }} />
                  </>
                )}
                <Icon className={cn('w-4 h-4 transition-all', isActive && 'hud-active-pulse')} style={{ color: isActive ? color : '#94a3b8' }} />
                <span className={cn('absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full', dotCls)} />
              </Link>
              <Tooltip label={item.label} color={color} />
            </div>
          )
        })}

        <div className="mx-auto w-7 h-px bg-[#233044] my-2" />

        {OPERATIONS_ITEMS.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <div key={item.href} className="relative group/item">
              <Link href={item.href} className={cn('flex items-center justify-center w-full h-10 relative transition-all', isActive ? 'bg-[#101827] text-blue-400' : 'text-muted-foreground hover:bg-[#0f1726] hover:text-foreground')}>
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]" />}
                <Icon className={cn('w-4 h-4', isActive && 'hud-active-pulse')} />
              </Link>
              <Tooltip label={item.label} color="#60a5fa" />
            </div>
          )
        })}

        <div className="mx-auto w-7 h-px bg-[#233044] my-2" />

        <div className="relative group/item">
          <button onClick={() => setAddingWs(true)} className="flex items-center justify-center w-full h-10 text-muted-foreground hover:bg-[#0f1726] hover:text-foreground transition-colors" title="워크스페이스 추가">
            <Plus className="w-3.5 h-3.5" />
          </button>
          <Tooltip label="Workspace Add" color="#94a3b8" />
        </div>

        {workspaces.map(ws => {
          const isActive = pathname === '/' && activeWorkspaceId === ws.id
          return (
            <div key={ws.id} className="relative group/item">
              <button
                onClick={() => {
                  setActiveWorkspace(ws.id)
                  if (pathname !== '/') router.push('/')
                }}
                className={cn('flex items-center justify-center w-full h-10 text-sm transition-all relative', isActive ? 'bg-[#101827] text-blue-400' : 'text-muted-foreground hover:bg-[#0f1726] hover:text-foreground')}
              >
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]" />}
                <span>{ws.icon ?? '📁'}</span>
              </button>
              <Tooltip label={ws.name} color="#94a3b8" />
            </div>
          )
        })}

        {favorites.length > 0 && (
          <>
            <div className="mx-auto w-7 h-px bg-[#233044] my-2" />
            {favorites.slice(0, 4).map(fav => (
              <div key={`${fav.type}-${fav.id}`} className="relative group/item">
                <Link href={`${ENTITY_ROUTES[fav.type] ?? ''}/${fav.id}`} className="flex items-center justify-center w-full h-10 text-muted-foreground hover:bg-[#0f1726] hover:text-amber-400 transition-colors">
                  <Star className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
                </Link>
                <Tooltip label={fav.title} color="#f59e0b" truncate />
              </div>
            ))}
          </>
        )}
      </div>

      {addingWs && (
        <div className="absolute left-14 bottom-20 z-50 w-48 bg-[#101827] border border-[#2a3040] p-3 shadow-none hud-frame-corners">
          <div className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider hud-mono">새 워크스페이스</div>
          <input
            ref={wsInputRef}
            value={wsName}
            onChange={e => setWsName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAddWorkspace()
              if (e.key === 'Escape') { setAddingWs(false); setWsName('') }
            }}
            placeholder="이름 입력"
            className="w-full bg-transparent border-b border-blue-400 text-sm outline-none px-1 py-0.5 text-foreground"
          />
          <div className="flex gap-1 mt-2">
            <button onClick={handleAddWorkspace} className="flex-1 flex items-center justify-center p-1 text-blue-400 hover:bg-blue-400/10"><Check className="w-3.5 h-3.5" /></button>
            <button onClick={() => { setAddingWs(false); setWsName('') }} className="flex-1 flex items-center justify-center p-1 text-muted-foreground hover:bg-muted"><X className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      )}

      <div className="relative border-t border-[#233044] py-2 shrink-0 bg-white/[0.02]">
        <div className="flex items-center justify-center h-8 mb-1">
          <span className="hud-mono text-[8px] tracking-[0.2em] text-muted-foreground">ARETE</span>
        </div>
        <div className="relative group/item">
          <button onClick={handleLogout} className="flex items-center justify-center w-full h-10 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="로그아웃">
            <LogOut className="w-3.5 h-3.5" />
          </button>
          <Tooltip label="로그아웃" color="#f43f5e" />
        </div>
      </div>
    </aside>
  )
}

function SidebarIcon({ href, label, isActive, accent, children }: { href: string; label: string; isActive: boolean; accent: string; children: React.ReactNode }) {
  return (
    <div className="relative group/item">
      <Link href={href} className={cn('flex items-center justify-center w-full h-10 transition-all relative', isActive ? 'bg-[#101827] text-blue-400' : 'text-muted-foreground hover:bg-[#0f1726] hover:text-foreground')}>
        {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4" style={{ background: accent, boxShadow: `0 0 10px ${accent}` }} />}
        <span className={cn(isActive && 'hud-active-pulse')}>{children}</span>
      </Link>
      <Tooltip label={label} color={accent} />
    </div>
  )
}

function Tooltip({ label, color, truncate }: { label: string; color: string; truncate?: boolean }) {
  return (
    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 pointer-events-none opacity-0 group-hover/item:opacity-100 transition-opacity duration-150">
      <div className={cn('px-2.5 py-1.5 text-[10px] whitespace-nowrap bg-[#101827] border text-[#94a3b8] hud-mono', truncate && 'max-w-[180px] truncate')} style={{ borderColor: color, color }}>
        {label}
      </div>
    </div>
  )
}
