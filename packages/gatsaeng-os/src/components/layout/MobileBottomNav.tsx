'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  CheckSquare,
  StickyNote,
  Target,
  Menu,
  Layers,
  FolderKanban,
  RotateCcw,
  BookMarked,
  CalendarDays,
  BookOpen,
  Timer,
  X,
  Mic,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/', label: '홈', icon: Home },
  { href: '/tasks', label: '할일', icon: CheckSquare },
  { href: '/notes', label: '노트', icon: StickyNote },
  { href: '/goals', label: '목표', icon: Target },
]

// No duplicate '/' — Dashboard is already in NAV_ITEMS as '홈'
const MORE_ITEMS = [
  { href: '/areas', label: '영역', icon: Layers },
  { href: '/projects', label: '프로젝트', icon: FolderKanban },
  { href: '/routines', label: '루틴', icon: RotateCcw },
  { href: '/books', label: '독서', icon: BookMarked },
  { href: '/calendar', label: '캘린더', icon: CalendarDays },
  { href: '/focus', label: '포커스', icon: Timer },
  { href: '/review', label: '계획 & 회고', icon: BookOpen },
  { href: '/voice', label: 'Eve 보이스', icon: Mic },
]

function isNavActive(href: string, pathname: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowMore(false)} />
          <div className="absolute bottom-16 left-0 right-0 bg-background border-t border-border rounded-t-xl p-4 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">메뉴</span>
              <button onClick={() => setShowMore(false)} className="p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {MORE_ITEMS.map(item => {
                const Icon = item.icon
                const isActive = isNavActive(item.href, pathname)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className={cn(
                      'flex flex-col items-center gap-1 py-2 rounded-lg text-xs transition-colors',
                      isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-background border-t border-border">
        <div className="flex items-center justify-around h-14 px-2">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const isActive = isNavActive(item.href, pathname)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
                {item.label}
              </Link>
            )
          })}
          <button
            onClick={() => setShowMore(v => !v)}
            className={cn(
              'flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] transition-colors',
              showMore ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Menu className={cn('w-5 h-5', showMore && 'stroke-[2.5]')} />
            메뉴
          </button>
        </div>
      </nav>
    </>
  )
}
