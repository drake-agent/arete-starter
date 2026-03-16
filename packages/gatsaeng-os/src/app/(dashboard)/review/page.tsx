'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, ChevronRight, Star, Calendar, Sun, CalendarDays, ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Review } from '@/types'

const WEEKLY_PROMPTS = [
  { key: 'accomplished', label: '이번 주 가장 잘한 것', placeholder: '구체적인 성취를 적어주세요', icon: '🏆' },
  { key: 'struggled', label: '어디서 막혔는가', placeholder: '어떤 상황에서 어려움을 느꼈나요?', icon: '🧱' },
  { key: 'learnings', label: '배운 점', placeholder: '이번 주 가장 큰 깨달음은?', icon: '💡' },
  { key: 'next_week_focus', label: '다음 주 포커스', placeholder: '다음 주에 집중할 한 가지는?', icon: '🎯' },
  { key: 'energy_pattern', label: '에너지 패턴', placeholder: '언제 에너지가 높았고, 언제 낮았나요?', icon: '⚡' },
  { key: 'habit_insight', label: '루틴 인사이트', placeholder: '습관 유지에 도움이 된 것 / 방해한 것은?', icon: '🔄' },
]

const DAILY_PROMPTS = [
  { key: 'accomplished', label: '오늘 가장 잘한 것', placeholder: '오늘의 작은 성취를 적어주세요', icon: '🏆' },
  { key: 'struggled', label: '어려웠던 점', placeholder: '오늘 어떤 부분이 어려웠나요?', icon: '🧱' },
  { key: 'learnings', label: '오늘의 깨달음', placeholder: '오늘 배운 것은?', icon: '💡' },
  { key: 'next_week_focus', label: '내일 포커스', placeholder: '내일 가장 중요한 한 가지는?', icon: '🎯' },
]

const MONTHLY_PROMPTS = [
  { key: 'accomplished', label: '이번 달 주요 성취', placeholder: '이번 달 가장 의미 있는 성취는?', icon: '🏆' },
  { key: 'struggled', label: '반복된 어려움', placeholder: '이번 달 반복적으로 막힌 부분은?', icon: '🧱' },
  { key: 'learnings', label: '핵심 교훈', placeholder: '이번 달의 핵심 교훈은?', icon: '💡' },
  { key: 'next_week_focus', label: '다음 달 방향', placeholder: '다음 달 전략과 집중 방향은?', icon: '🎯' },
  { key: 'energy_pattern', label: '에너지/생산성 패턴', placeholder: '이번 달 에너지와 생산성 패턴 분석', icon: '⚡' },
  { key: 'habit_insight', label: '습관/루틴 점검', placeholder: '유지할 습관과 바꿀 습관은?', icon: '🔄' },
]

type ReviewTab = 'daily' | 'weekly' | 'monthly'
const PROMPTS_MAP: Record<ReviewTab, typeof WEEKLY_PROMPTS> = {
  daily: DAILY_PROMPTS,
  weekly: WEEKLY_PROMPTS,
  monthly: MONTHLY_PROMPTS,
}
const TAB_LABELS: Record<ReviewTab, string> = { daily: '일간 리뷰', weekly: '주간 리뷰', monthly: '월간 리뷰' }

function getWeekStart(date: Date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().slice(0, 10)
}

export default function ReviewPage() {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<'list' | 'write' | 'view'>('list')
  const [reviewTab, setReviewTab] = useState<ReviewTab>('weekly')
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [mood, setMood] = useState(3)
  const [score, setScore] = useState(7)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [viewingReview, setViewingReview] = useState<Review | null>(null)

  const { data: reviews } = useQuery({
    queryKey: ['reviews'],
    queryFn: async (): Promise<Review[]> => {
      const res = await fetch('/api/reviews')
      return res.json()
    },
  })

  const createReview = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      setMode('list')
      setFormData({})
      setEditingReview(null)
    },
  })

  const updateReview = useMutation({
    mutationFn: async ({ id, ...data }: Record<string, unknown> & { id: string }) => {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      setMode('list')
      setFormData({})
      setEditingReview(null)
    },
  })

  const deleteReview = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/reviews/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      setMode('list')
      setViewingReview(null)
    },
  })

  const handleSubmit = () => {
    const today = new Date().toISOString().slice(0, 10)
    const base: Record<string, unknown> = { mood, score, ...formData }

    if (editingReview?.id) {
      // Update existing
      const tab = (editingReview.type as ReviewTab) || 'weekly'
      if (tab === 'daily') {
        base.type = 'daily'
        base.date = editingReview.date || today
      } else if (tab === 'monthly') {
        base.type = 'monthly'
        base.week_start = editingReview.week_start || today.slice(0, 7)
      } else {
        base.type = 'weekly'
        base.week_start = editingReview.week_start || getWeekStart()
      }
      updateReview.mutate({ id: editingReview.id, ...base })
    } else {
      // Create new
      if (reviewTab === 'daily') {
        base.type = 'daily'
        base.date = today
      } else if (reviewTab === 'monthly') {
        base.type = 'monthly'
        base.week_start = today.slice(0, 7)
      } else {
        base.type = 'weekly'
        base.week_start = getWeekStart()
      }
      createReview.mutate(base)
    }
  }

  const handleEdit = (review: Review) => {
    setEditingReview(review)
    const tab = (review.type as ReviewTab) || 'weekly'
    setReviewTab(tab)
    setFormData({
      accomplished: review.accomplished ?? '',
      struggled: review.struggled ?? '',
      learnings: review.learnings ?? '',
      next_week_focus: review.next_week_focus ?? '',
      energy_pattern: review.energy_pattern ?? '',
      habit_insight: review.habit_insight ?? '',
    })
    setMood(review.mood ?? 3)
    setScore(review.score ?? 7)
    setMode('write')
  }

  const handleDelete = (id: string) => {
    if (!confirm('이 회고를 삭제하시겠습니까?')) return
    deleteReview.mutate(id)
  }

  const handleView = (review: Review) => {
    setViewingReview(review)
    setMode('view')
  }

  const weekStart = getWeekStart()
  const today = new Date().toISOString().slice(0, 10)
  const allReviews = reviews ?? []
  const filteredReviews = allReviews.filter(r => {
    if (reviewTab === 'daily') return r.type === 'daily' || r.date
    if (reviewTab === 'monthly') return r.type === 'monthly'
    return !r.type || r.type === 'weekly'
  })
  const thisWeekReview = reviewTab === 'weekly'
    ? allReviews.find(r => r.week_start === weekStart && (!r.type || r.type === 'weekly'))
    : reviewTab === 'daily'
    ? allReviews.find(r => r.date === today && r.type === 'daily')
    : allReviews.find(r => r.type === 'monthly' && r.week_start === today.slice(0, 7))
  const sortedReviews = [...filteredReviews].sort((a, b) => (b.week_start ?? b.date ?? '').localeCompare(a.week_start ?? a.date ?? ''))

  // View mode
  if (mode === 'view' && viewingReview) {
    const vTab = (viewingReview.type as ReviewTab) || 'weekly'
    const prompts = PROMPTS_MAP[vTab]
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={() => { setMode('list'); setViewingReview(null) }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> 목록으로
            </button>
            <h1 className="text-2xl font-bold text-foreground">
              {TAB_LABELS[vTab]}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {viewingReview.date || viewingReview.week_start}
              {viewingReview.mood && ` · 기분 ${viewingReview.mood}/5`}
              {viewingReview.score && ` · 점수 ${viewingReview.score}/10`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleEdit(viewingReview)}>
              <Pencil className="w-3.5 h-3.5 mr-1" /> 수정
            </Button>
            <Button variant="outline" size="sm" className="text-gatsaeng-red hover:text-gatsaeng-red" onClick={() => viewingReview.id && handleDelete(viewingReview.id)}>
              <Trash2 className="w-3.5 h-3.5 mr-1" /> 삭제
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {prompts.map(prompt => {
            const value = (viewingReview as unknown as Record<string, unknown>)[prompt.key] as string | undefined
            if (!value) return null
            return (
              <Card key={prompt.key}>
                <CardContent className="py-4">
                  <Label className="text-sm flex items-center gap-2 mb-2">
                    <span>{prompt.icon}</span>
                    {prompt.label}
                  </Label>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{value}</p>
                </CardContent>
              </Card>
            )
          })}

          {(viewingReview.mood || viewingReview.score) && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center gap-6">
                  {viewingReview.mood && (
                    <div>
                      <Label className="text-xs text-muted-foreground block mb-1">기분</Label>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: viewingReview.mood }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-gatsaeng-amber text-gatsaeng-amber" />
                        ))}
                      </div>
                    </div>
                  )}
                  {viewingReview.score && (
                    <div>
                      <Label className="text-xs text-muted-foreground block mb-1">점수</Label>
                      <span className="text-lg font-bold text-primary">{viewingReview.score}/10</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  // Write/Edit mode
  if (mode === 'write') {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {editingReview ? `${TAB_LABELS[(editingReview.type as ReviewTab) || 'weekly']} 수정` : `${TAB_LABELS[reviewTab]} 작성`}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {editingReview
                ? (editingReview.date || editingReview.week_start)
                : reviewTab === 'daily' ? today : reviewTab === 'monthly' ? today.slice(0, 7) : `${weekStart} 주`}
            </p>
          </div>
          <Button variant="outline" onClick={() => { setMode('list'); setEditingReview(null); setFormData({}) }}>목록으로</Button>
        </div>

        <div className="space-y-4">
          {PROMPTS_MAP[editingReview ? ((editingReview.type as ReviewTab) || 'weekly') : reviewTab].map(prompt => (
            <Card key={prompt.key}>
              <CardContent className="py-4">
                <Label className="text-sm flex items-center gap-2 mb-2">
                  <span>{prompt.icon}</span>
                  {prompt.label}
                </Label>
                <textarea
                  className="w-full bg-transparent border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  rows={3}
                  placeholder={prompt.placeholder}
                  value={formData[prompt.key] ?? ''}
                  onChange={e => setFormData(prev => ({ ...prev, [prompt.key]: e.target.value }))}
                />
              </CardContent>
            </Card>
          ))}

          {/* Mood & Score */}
          <Card>
            <CardContent className="py-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm mb-3 block">기분 (1-5)</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button
                        key={v}
                        onClick={() => setMood(v)}
                        className={`w-9 h-9 rounded-md flex items-center justify-center text-sm font-medium transition-colors ${
                          mood >= v
                            ? 'bg-gatsaeng-amber text-black'
                            : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm mb-3 block">점수 (1-10)</Label>
                  <div className="flex gap-1 flex-wrap">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => (
                      <button
                        key={v}
                        onClick={() => setScore(v)}
                        className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium transition-colors ${
                          score >= v
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSubmit}
            disabled={createReview.isPending || updateReview.isPending}
            className="w-full bg-gatsaeng-purple hover:bg-gatsaeng-purple/80 text-white"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            {editingReview ? '회고 수정' : '회고 저장'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">계획 & 회고</h1>
          <p className="text-sm text-muted-foreground mt-1">Deliberate Practice 기반 구조화된 회고</p>
        </div>
        {!thisWeekReview && (
          <Button
            onClick={() => { setEditingReview(null); setFormData({}); setMode('write') }}
            className="bg-gatsaeng-purple hover:bg-gatsaeng-purple/80 text-white"
          >
            <BookOpen className="w-4 h-4 mr-2" /> {TAB_LABELS[reviewTab]}
          </Button>
        )}
      </div>

      <Tabs value={reviewTab} onValueChange={(v) => setReviewTab(v as ReviewTab)} className="mb-6">
        <TabsList>
          <TabsTrigger value="daily" className="gap-1.5">
            <Sun className="w-3.5 h-3.5" /> 일간
          </TabsTrigger>
          <TabsTrigger value="weekly" className="gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> 주간
          </TabsTrigger>
          <TabsTrigger value="monthly" className="gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" /> 월간
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {sortedReviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">아직 회고가 없습니다</p>
            <Button onClick={() => { setEditingReview(null); setFormData({}); setMode('write') }} className="bg-gatsaeng-purple hover:bg-gatsaeng-purple/80 text-white">
              첫 회고 작성하기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedReviews.map(review => (
            <Card
              key={review.id}
              className={cn(
                'hover:border-primary/30 transition-colors cursor-pointer group',
                review.week_start === weekStart && 'border-gatsaeng-purple/30'
              )}
              onClick={() => handleView(review)}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gatsaeng-purple/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-gatsaeng-purple" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{review.date || review.week_start}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {review.mood && (
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: review.mood }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-gatsaeng-amber text-gatsaeng-amber" />
                            ))}
                          </div>
                        )}
                        {review.score && (
                          <Badge variant="outline" className="text-[10px]">
                            {review.score}/10
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {review.week_start === weekStart && (
                      <Badge className="text-[10px] bg-gatsaeng-purple/10 text-gatsaeng-purple border-gatsaeng-purple/30">
                        이번 주
                      </Badge>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(review) }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-primary/10 rounded"
                    >
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); review.id && handleDelete(review.id) }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-gatsaeng-red" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                {/* Preview of content */}
                {review.accomplished && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                    🏆 {review.accomplished}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
