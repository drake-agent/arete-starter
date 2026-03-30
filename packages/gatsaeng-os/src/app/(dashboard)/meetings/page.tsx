'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Mic, Calendar, Clock, X, CheckSquare, Square, ChevronRight, BookOpen, ArrowRightLeft, Tag } from 'lucide-react'
import type { Meeting, PlaybookCandidate, DrakeAction } from '@/types'
import { DOMAIN_COLORS, TRANSFERABILITY_COLORS } from '@/config/colors'

function MeetingModal({ meeting, onClose }: { meeting: Meeting; onClose: () => void }) {
  const router = useRouter()

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

  const handlePlaybookClick = () => {
    onClose()
    router.push('/playbooks')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="meeting-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border rounded-sm w-full max-w-2xl max-h-[85vh] flex flex-col shadow-none"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div className="flex-1 min-w-0">
            <h2 id="meeting-modal-title" className="text-lg font-bold truncate">{meeting.title}</h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              {meeting.date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {meeting.date}
                </span>
              )}
              {meeting.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {meeting.duration}
                </span>
              )}
            </div>
            {meeting.domains.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {meeting.domains.map(d => (
                  <span key={d} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${DOMAIN_COLORS[d] || 'bg-muted text-muted-foreground'}`}>
                    {d}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-3 p-1.5 rounded-sm hover:bg-muted transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drake Actions (always on top if present) */}
        {meeting.drakeActions.length > 0 && (
          <div className="px-5 py-3 border-b border-border bg-muted/30">
            <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <CheckSquare className="w-3.5 h-3.5" />
              Drake 액션
            </div>
            <div className="space-y-1.5">
              {meeting.drakeActions.map((action, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  {action.done ? (
                    <CheckSquare className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  )}
                  <span className={action.done ? 'line-through text-muted-foreground' : 'text-foreground'}>
                    {action.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Playbook Candidates (if any) */}
        {meeting.playbooks && meeting.playbooks.length > 0 && (
          <div className="px-5 py-3 border-b border-border bg-blue-500/5">
            <div className="text-xs font-semibold text-blue-400 mb-3 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              📕 Playbook Candidates
            </div>
            <div className="space-y-2">
              {meeting.playbooks.map((pb, i) => (
                <button
                  key={i}
                  onClick={handlePlaybookClick}
                  className="w-full text-left rounded-sm border border-blue-500/20 bg-background hover:bg-blue-500/10 transition-colors p-3 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium group-hover:text-blue-400 transition-colors truncate">
                        {pb.title || `Playbook 후보 #${i + 1}`}
                      </div>
                      {pb.context && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                          {pb.context}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {pb.transferability && (
                          <span className={`text-[10px] flex items-center gap-0.5 ${TRANSFERABILITY_COLORS[pb.transferability.toLowerCase()] || 'text-muted-foreground'}`}>
                            <ArrowRightLeft className="w-2.5 h-2.5" />
                            {pb.transferability}
                          </span>
                        )}
                        {pb.domains && pb.domains.length > 0 && pb.domains.map((d: string) => (
                          <span key={d} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5 ${DOMAIN_COLORS[d] || 'bg-muted text-muted-foreground'}`}>
                            <Tag className="w-2 h-2" />
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-400 transition-colors shrink-0 mt-0.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Full content */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="prose prose-sm prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans leading-relaxed">
              {meeting.content ?? '회의록 전문은 파일에서 직접 확인하세요.'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MeetingsPage() {
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)

  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
    queryKey: ['meetings'],
    queryFn: async () => {
      const res = await fetch('/api/meetings')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    },
    staleTime: 1000 * 60 * 5,
  })

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Mic className="w-6 h-6 text-gatsaeng-purple" />
          미팅 인텔
        </h1>
        {!isLoading && (
          <span className="text-sm text-muted-foreground">
            총 {meetings.length}건
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Plaud 미팅 브리핑 — 회의를 결과로 바꾼다.
      </p>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-sm bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && meetings.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Mic className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">미팅 데이터가 없습니다.</p>
          <p className="text-xs mt-1 opacity-70">
            Plaud로 미팅을 녹음하면 여기에 자동으로 쌓입니다.
          </p>
        </div>
      )}

      {!isLoading && meetings.length > 0 && (
        <div className="space-y-3">
          {meetings.map(meeting => (
            <button
              key={meeting.fileId}
              onClick={() => setSelectedMeeting(meeting)}
              className="w-full text-left rounded-sm border border-border bg-card hover:bg-muted/50 transition-colors p-4 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate group-hover:text-gatsaeng-purple transition-colors">
                    {meeting.title}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {meeting.date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {meeting.date}
                      </span>
                    )}
                    {meeting.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {meeting.duration}
                      </span>
                    )}
                    {meeting.drakeActions.filter(a => !a.done).length > 0 && (
                      <span className="flex items-center gap-1 text-orange-400">
                        <Square className="w-3 h-3" />
                        액션 {meeting.drakeActions.filter(a => !a.done).length}개
                      </span>
                    )}
                    {meeting.playbooks && meeting.playbooks.length > 0 && (
                      <span className="flex items-center gap-1 text-blue-400">
                        <BookOpen className="w-3 h-3" />
                        플레이북 {meeting.playbooks.length}개
                      </span>
                    )}
                  </div>
                  {meeting.domains.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {meeting.domains.map(d => (
                        <span key={d} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${DOMAIN_COLORS[d] || 'bg-muted text-muted-foreground'}`}>
                          {d}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-gatsaeng-purple transition-colors shrink-0 mt-0.5" />
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedMeeting && (
        <MeetingModal
          meeting={selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
        />
      )}
    </div>
  )
}
