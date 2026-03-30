'use client'

import { useQuery } from '@tanstack/react-query'
import { FileText, ExternalLink, RefreshCw } from 'lucide-react'
import type { ReportCategory } from '@/app/api/cockpit/reports/route'

const CATEGORY_LABELS: Record<ReportCategory, string> = {
  invest: '📈 투자 리포트',
  beauty: '💄 뷰티 리포트',
  saju: '🧭 사주 리포트',
  general: '📄 리포트',
}

const CATEGORY_COLOR: Record<ReportCategory, string> = {
  invest: 'text-blue-400',
  beauty: 'text-pink-400',
  saju: 'text-gatsaeng-purple',
  general: 'text-muted-foreground',
}

interface ReportCardProps {
  category: ReportCategory
}

interface Report {
  filename: string
  category: ReportCategory
  modifiedAt: string
  sizeKb: number
}

export function ReportCard({ category }: ReportCardProps) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['cockpit-reports', category],
    queryFn: async () => {
      const res = await fetch(`/api/cockpit/reports?category=${category}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    },
    staleTime: 1000 * 60 * 10,
  })

  const reports: Report[] = data?.reports || []
  const latest = reports[0]

  const formatDate = (iso: string | undefined) => {
    if (!iso) return 'DATA LINK PENDING...'
    const d = new Date(iso)
    if (isNaN(d.getTime())) return 'DATA LINK PENDING...'
    return d.toLocaleString('ko-KR', {
      month: 'numeric', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Asia/Seoul',
    })
  }

  return (
    <div className="p-4 h-full flex flex-col gap-3 overflow-auto">
      <div className="flex items-center gap-2">
        <FileText className={`w-4 h-4 ${CATEGORY_COLOR[category]}`} />
        <span className={`text-xs font-semibold ${CATEGORY_COLOR[category]}`}>
          {CATEGORY_LABELS[category]}
        </span>
        <button
          onClick={() => refetch()}
          className="ml-auto p-1 rounded hover:bg-muted transition-colors"
        >
          <RefreshCw className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-xs text-muted-foreground">로딩 중...</div>
        </div>
      ) : isError ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">리포트 로딩 실패</p>
        </div>
      ) : latest ? (
        <>
          {/* Latest report */}
          <div className="border border-border rounded-sm p-3 bg-muted/30">
            <div className="text-xs font-medium text-foreground leading-snug mb-1 truncate">
              {latest.filename.replace('.pdf', '')}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                {formatDate(latest.modifiedAt)} · {latest.sizeKb}KB
              </span>
              <a
                href={`/api/cockpit/pdf?file=${encodeURIComponent(latest.filename)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[10px] text-primary hover:underline"
              >
                열기 <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>

          {/* Recent list */}
          {(() => {
            const recent = reports.slice(1, 4)
            if (recent.length === 0) return null
            return (
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                최근 리포트
              </div>
              {recent.map((r: Report) => (
                <div key={r.filename} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate flex-1 pr-2" title={r.filename}>
                    {r.filename.replace('.pdf', '')}
                  </span>
                  <a
                    href={`/api/cockpit/pdf?file=${encodeURIComponent(r.filename)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-primary shrink-0"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
            )
          })()}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">DATA LINK PENDING...</p>
        </div>
      )}
    </div>
  )
}
