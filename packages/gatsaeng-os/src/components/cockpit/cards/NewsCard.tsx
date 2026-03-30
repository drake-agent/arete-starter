'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/apiFetch'

interface NewsItem {
  title: string
  link: string
  pubDate: string
  source: string
}

const KEYWORD_OPTIONS = [
  { value: '', label: '📰 주요뉴스' },
  { value: '화장품', label: '💄 화장품' },
  { value: 'K-뷰티', label: '✨ K-뷰티' },
  { value: '바닐라코', label: '🍦 바닐라코' },
  { value: '뷰티', label: '💅 뷰티' },
  { value: '투자', label: '📈 투자' },
]

function formatRelativeTime(pubDate: string): string {
  if (!pubDate) return ''
  try {
    const date = new Date(pubDate)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return '방금'
    if (diffMin < 60) return `${diffMin}분 전`
    const diffHour = Math.floor(diffMin / 60)
    if (diffHour < 24) return `${diffHour}시간 전`
    const diffDay = Math.floor(diffHour / 24)
    return `${diffDay}일 전`
  } catch {
    return ''
  }
}

export function NewsCard() {
  const [keyword, setKeyword] = useState('')

  const { data: items = [], isLoading, error, refetch } = useQuery<NewsItem[]>({
    queryKey: ['news', keyword],
    queryFn: () => {
      const url = keyword ? `/api/news?q=${encodeURIComponent(keyword)}` : '/api/news'
      return apiFetch<NewsItem[]>(url)
    },
    staleTime: 1000 * 60 * 5, // 5분
    refetchInterval: 1000 * 60 * 10, // 10분 자동 갱신
  })

  return (
    <div className="flex flex-col h-full gap-2">
      {/* 키워드 셀렉트 */}
      <div className="flex items-center gap-2 px-1">
        <select
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          className="text-xs bg-muted/30 border border-border/40 rounded-md px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
        >
          {KEYWORD_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => refetch()}
          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors ml-auto"
          title="새로고침"
        >
          🔄
        </button>
      </div>

      {/* 뉴스 리스트 */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
        {isLoading && (
          <div className="space-y-2 px-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted/30 rounded animate-pulse" />
            ))}
          </div>
        )}

        {error && !isLoading && (
          <div className="text-xs text-muted-foreground px-1 py-2">
            뉴스를 불러올 수 없습니다.
          </div>
        )}

        {!isLoading && !error && items.length === 0 && (
          <div className="text-xs text-muted-foreground px-1 py-2">
            뉴스가 없습니다.
          </div>
        )}

        {!isLoading && items.map((item, idx) => (
          <a
            key={idx}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-2 py-1.5 rounded-sm bg-muted/20 hover:bg-muted/35 transition-colors group"
          >
            <p className="text-xs font-medium text-foreground group-hover:text-primary line-clamp-2 leading-snug">
              {item.title}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {item.source && (
                <span className="text-[9px] text-muted-foreground/70 truncate max-w-[120px]">
                  {item.source}
                </span>
              )}
              {item.source && item.pubDate && (
                <span className="text-[9px] text-muted-foreground/40">·</span>
              )}
              {item.pubDate && (
                <span className="text-[9px] text-muted-foreground/50 shrink-0">
                  {formatRelativeTime(item.pubDate)}
                </span>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
