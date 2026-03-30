'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, ExternalLink, Leaf, Coffee, Home, Palette } from 'lucide-react'
import { apiFetch } from '@/lib/apiFetch'
import type { Book } from '@/types'
import { HudAxisPage, HudCard, HudDataPending } from '@/components/layout/HudAxisPage'

function ReadingNow() {
  const color = '#14b8a6'
  const { data: books = [], isLoading } = useQuery<Book[]>({
    queryKey: ['books'],
    queryFn: () => apiFetch<Book[]>('/api/books'),
    staleTime: 1000 * 60 * 5,
  })

  const reading = books.filter(b => b.status === 'reading')

  if (isLoading) {
    return <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-16 hud-card animate-pulse" />)}</div>
  }

  return (
    <HudCard title="READING CHANNEL" color={color} icon={<BookOpen className="w-4 h-4" />} topRight="LIBRARY FEED">
      {reading.length === 0 ? (
        <HudDataPending label="DATA LINK PENDING... READING SESSION" />
      ) : (
        <div className="space-y-3">
          {reading.map(book => (
            <Link key={book.id} href={`/books/${book.id}`} className="flex items-start gap-3 group border p-3" style={{ borderColor: `${color}22`, background: 'rgba(20,184,166,0.04)' }}>
              <div className="w-10 h-14 flex items-center justify-center shrink-0 text-lg overflow-hidden border border-[#2a3040] bg-muted/20">📖</div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate group-hover:text-teal-300 transition-colors">{book.title}</div>
                {book.author && <div className="text-xs text-muted-foreground truncate">{book.author}</div>}
                {book.current_page && book.total_pages && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                      <span>{book.current_page} / {book.total_pages}</span>
                      <span>{Math.round((book.current_page / book.total_pages) * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#111827] border border-white/5 overflow-hidden">
                      <div className="h-full bg-teal-500" style={{ width: `${Math.min((book.current_page / book.total_pages) * 100, 100)}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </HudCard>
  )
}

export default function LifestylePage() {
  const color = '#14b8a6'

  return (
    <HudAxisPage
      title="LIFESTYLE"
      subtitle="식사·수면·운동·환경 — 매일의 삶의 질을 높이는 선택들."
      icon={<Leaf className="w-6 h-6" />}
      color={color}
      score={61}
    >
      <HudCard title="QUALITY OF LIFE BAR" color={color} icon={<Leaf className="w-4 h-4" />} topRight="DAILY TEXTURE">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ['READ', '72'],
            ['TASTE', '--'],
            ['REST', '--'],
            ['SPACE', '--'],
          ].map(([label, value]) => (
            <div key={label} className="border px-3 py-3" style={{ borderColor: `${color}22`, background: `${color}08` }}>
              <div className="hud-label mb-1" style={{ color }}>{label}</div>
              <div className="hud-mono text-xl font-bold text-foreground">{value}</div>
            </div>
          ))}
        </div>
      </HudCard>

      <ReadingNow />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HudCard title="TASTE" color={color} icon={<Coffee className="w-4 h-4" />}>
          <HudDataPending label="DATA LINK PENDING... FOOD / WINE / CAFÉ" />
        </HudCard>

        <HudCard title="ENVIRONMENT" color={color} icon={<Home className="w-4 h-4" />}>
          <HudDataPending label="DATA LINK PENDING... HOME / DESK / AMBIENCE" />
        </HudCard>

        <HudCard title="AESTHETIC INPUT" color={color} icon={<Palette className="w-4 h-4" />}>
          <HudDataPending label="DATA LINK PENDING... TASTE / CURATION / SIGNALS" />
        </HudCard>
      </div>

      <HudCard title="QUICK ROUTES" color={color} icon={<ExternalLink className="w-4 h-4" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/books" className="flex items-center gap-3 p-3 border hover:border-teal-500/40 hover:bg-teal-500/5 transition-all" style={{ borderColor: '#2a3040' }}>
            <div className="w-8 h-8 flex items-center justify-center shrink-0 bg-teal-500/10 border border-teal-500/20">
              <BookOpen className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <div className="font-medium text-sm">독서</div>
              <div className="text-xs text-muted-foreground">독서 기록 & 서재</div>
            </div>
          </Link>
        </div>
      </HudCard>
    </HudAxisPage>
  )
}
