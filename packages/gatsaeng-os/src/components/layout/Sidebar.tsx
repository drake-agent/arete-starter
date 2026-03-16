'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { ENTITY_ROUTES } from '@/lib/routes'
import { useFavoritesStore } from '@/stores/favoritesStore'
import {
  LayoutDashboard,
  Target,
  FolderKanban,
  RotateCcw,
  BookOpen,
  BookMarked,
  CalendarDays,
  Layers,
  Sun,
  Moon,
  Monitor,
  CheckSquare,
  StickyNote,
  LogOut,
  Star,
  Mic,
} from 'lucide-react'

const SIDEBAR_ITEMS = [
  { href: '/', label: '대시보드', icon: LayoutDashboard },
  { href: '/areas', label: '영역', icon: Layers },
  { href: '/goals', label: '목표', icon: Target },
  { href: '/projects', label: '프로젝트', icon: FolderKanban },
  { href: '/tasks', label: '할일', icon: CheckSquare },
  { href: '/routines', label: '루틴', icon: RotateCcw },
  { href: '/notes', label: '노트', icon: StickyNote },
  { href: '/books', label: '독서', icon: BookMarked },
  { href: '/calendar', label: '캘린더', icon: CalendarDays },
  { href: '/review', label: '계획 & 회고', icon: BookOpen },
  { href: '/voice', label: 'Eve 보이스', icon: Mic },
]

const THEME_OPTIONS = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'Auto' },
] as const

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const favorites = useFavoritesStore(s => s.favorites)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside className="w-56 h-full border-r border-border bg-background flex flex-col">
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-3">
          Navigation
        </div>
        <nav className="space-y-1">
          {SIDEBAR_ITEMS.map(item => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  isActive
                    ? 'bg-card text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card'
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {favorites.length > 0 && (
          <>
            <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-6 mb-3">
              Favorites
            </div>
            <div className="space-y-1">
              {favorites.map(fav => (
                <Link
                  key={`${fav.type}-${fav.id}`}
                  href={`${ENTITY_ROUTES[fav.type] ?? ''}/${fav.id}`}
                  className="flex items-center gap-3 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
                >
                  <Star className="w-3.5 h-3.5 text-gatsaeng-amber fill-gatsaeng-amber" />
                  <span className="truncate">{fav.title}</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="p-4 border-t border-border space-y-3">
        <div className="flex items-center gap-1 rounded-md bg-muted p-1">
          {THEME_OPTIONS.map(opt => {
            const Icon = opt.icon
            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1 rounded-sm px-2 py-1 text-xs transition-colors',
                  theme === opt.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title={opt.label}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            )
          })}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-gatsaeng-red hover:bg-gatsaeng-red/10 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          로그아웃
        </button>
        <div className="text-xs text-muted-foreground">
          갓생 OS v0.1
        </div>
      </div>
    </aside>
  )
}
