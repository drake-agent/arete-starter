'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { MobileSidebar } from './MobileSidebar'

const NAV_ITEMS = [
  { href: '/', label: '대시보드' },
  { href: '/goals', label: '목표' },
  { href: '/projects', label: '프로젝트' },
  { href: '/routines', label: '루틴' },
  { href: '/review', label: '회고' },
]

export function Header() {
  const pathname = usePathname()

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-card dark:bg-[#010409]">
      <div className="flex items-center gap-3">
        <MobileSidebar />
        <div className="font-mono font-bold text-lg flex items-center tracking-wider">
          <span className="text-primary mr-1.5">GS</span>
          <span className="text-foreground text-[11px] font-semibold border-l border-border pl-3 uppercase tracking-[0.2em] hidden sm:inline">
            GATSAENG OS
          </span>
        </div>
      </div>
      <nav className="hidden md:flex gap-8 text-sm font-medium">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'text-muted-foreground hover:text-primary transition-colors py-1',
              pathname === item.href && 'text-primary border-b-2 border-primary'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="w-8 md:w-48" />
    </header>
  )
}
