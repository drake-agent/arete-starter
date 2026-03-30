'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, ArrowRightLeft, Tag, X } from 'lucide-react'
import type { PlaybookCandidate } from '@/types'
import { DOMAIN_COLORS, TRANSFERABILITY_COLORS, TRANSFERABILITY_BADGE } from '@/config/colors'

function PlaybookModal({ playbook, onClose }: { playbook: PlaybookCandidate; onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const fields: Array<{ label: string; value?: string; emoji: string }> = [
    { label: '상황 (Context)', value: playbook.context, emoji: '📍' },
    { label: '신호 (Signal)', value: playbook.signal, emoji: '📡' },
    { label: '진단 (Diagnosis)', value: playbook.diagnosis, emoji: '🔍' },
    { label: '개입 (Intervention)', value: playbook.intervention, emoji: '⚡' },
    { label: '결과 (Outcome)', value: playbook.observed_or_expected_outcome, emoji: '📊' },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="playbook-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border rounded-sm w-full max-w-2xl max-h-[85vh] flex flex-col shadow-none"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div className="flex-1 min-w-0">
            <h2 id="playbook-modal-title" className="text-lg font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-400 shrink-0" />
              <span className="truncate">{playbook.title || 'Playbook'}</span>
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {playbook.transferability && (
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${TRANSFERABILITY_BADGE[playbook.transferability.toLowerCase()] || 'bg-muted text-muted-foreground'}`}>
                  <ArrowRightLeft className="w-3 h-3" />
                  이식성 {playbook.transferability}
                </span>
              )}
              {playbook.domains && playbook.domains.length > 0 && playbook.domains.map((d: string) => (
                <span key={d} className={`text-[11px] px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5 ${DOMAIN_COLORS[d] || 'bg-muted text-muted-foreground'}`}>
                  <Tag className="w-2.5 h-2.5" />
                  {d}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-3 p-1.5 rounded-sm hover:bg-muted transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {fields.map(f => f.value ? (
            <div key={f.label} className="rounded-sm border border-border bg-card p-4">
              <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                {f.emoji} {f.label}
              </div>
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {f.value}
              </p>
            </div>
          ) : null)}

          {/* EaaS Translation (if present) */}
          {playbook.eaas_translation && (
            <div className="rounded-sm border border-purple-500/30 bg-purple-500/5 p-4">
              <div className="text-xs font-semibold text-purple-400 mb-2 uppercase tracking-wider">
                🎯 EaaS Translation
              </div>
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {playbook.eaas_translation}
              </p>
            </div>
          )}

          {/* Fallback if no fields are populated */}
          {fields.every(f => !f.value) && !playbook.eaas_translation && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              상세 정보가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PlaybooksPage() {
  const [selected, setSelected] = useState<PlaybookCandidate | null>(null)

  const { data: candidates = [], isLoading } = useQuery<PlaybookCandidate[]>({
    queryKey: ['playbooks'],
    queryFn: async () => {
      const res = await fetch('/api/playbooks')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    },
    staleTime: 1000 * 60 * 10,
  })

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-400" />
          Playbooks
        </h1>
        {!isLoading && candidates.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {candidates.length}개 후보
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        반복 상황을 위한 실행 레시피. 한번 만들고 계속 써먹는다.
      </p>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 rounded-sm bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && candidates.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">아직 playbook 후보가 없습니다.</p>
          <p className="text-xs mt-1 opacity-70">
            Eve가 미팅과 운영에서 반복 패턴을 발견하면 여기에 쌓입니다.
          </p>
        </div>
      )}

      {!isLoading && candidates.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {candidates.map((c, i) => (
            <button
              key={i}
              onClick={() => setSelected(c)}
              className="rounded-sm border border-border bg-card p-4 hover:bg-muted/50 transition-colors text-left group"
            >
              <div className="font-semibold text-sm mb-2 group-hover:text-blue-400 transition-colors">
                {c.title || `Playbook #${i + 1}`}
              </div>

              {c.context && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-3 leading-relaxed">
                  {c.context}
                </p>
              )}

              <div className="flex items-center justify-between flex-wrap gap-2">
                {/* domains */}
                {c.domains && c.domains.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {c.domains.map((d: string) => (
                      <span key={d} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5 ${DOMAIN_COLORS[d] || 'bg-muted text-muted-foreground'}`}>
                        <Tag className="w-2.5 h-2.5" />
                        {d}
                      </span>
                    ))}
                  </div>
                )}

                {/* transferability */}
                {c.transferability && (
                  <div className={`text-xs flex items-center gap-1 ${TRANSFERABILITY_COLORS[c.transferability.toLowerCase()] || 'text-muted-foreground'}`}>
                    <ArrowRightLeft className="w-3 h-3" />
                    {c.transferability}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <PlaybookModal
          playbook={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
