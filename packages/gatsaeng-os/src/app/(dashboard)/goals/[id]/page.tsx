'use client'

import { use, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useUpdateGoal, useDeleteGoal } from '@/hooks/useGoals'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ArrowLeft, Target, Plus, Minus, Brain, UserCircle, MapPin, Calendar, Flag, Trash2, Pencil, Check, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMilestonesWithDDay, useCreateMilestone, useUpdateMilestone, useDeleteMilestone } from '@/hooks/useMilestones'
import type { Goal, MilestoneWithDDay } from '@/types'
import { LIMITS } from '@/types'

const TYPE_LABELS: Record<string, string> = {
  annual: '연간',
  quarterly: '분기',
  monthly: '월간',
}

export default function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [addAmount, setAddAmount] = useState(1)
  const { data: milestones = [] } = useMilestonesWithDDay(id)
  const createMilestone = useCreateMilestone()
  const updateMilestone = useUpdateMilestone()
  const deleteMilestone = useDeleteMilestone()
  const [msDialogOpen, setMsDialogOpen] = useState(false)
  const [editingMs, setEditingMs] = useState<MilestoneWithDDay | null>(null)
  const [msProgressEdit, setMsProgressEdit] = useState<{ id: string; value: number } | null>(null)

  const { data: goal, refetch } = useQuery({
    queryKey: ['goal', id],
    queryFn: async (): Promise<Goal> => {
      const res = await fetch(`/api/goals/${id}`)
      return res.json()
    },
  })

  const updateGoal = useUpdateGoal()
  const deleteGoal = useDeleteGoal()

  const handleDelete = () => {
    if (!confirm('이 목표를 삭제하시겠습니까?')) return
    deleteGoal.mutate(id, {
      onSuccess: () => router.push('/goals'),
    })
  }

  const handleUpdateProgress = (delta: number) => {
    if (!goal) return
    const newValue = Math.max(0, (goal.current_value ?? 0) + delta)
    updateGoal.mutate(
      { id, current_value: newValue },
      { onSuccess: () => refetch() }
    )
  }

  const handleMilestoneSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const payload = {
      title: form.get('ms_title') as string,
      target_value: Number(form.get('ms_target')) || 1,
      unit: (form.get('ms_unit') as string) || '',
      due_date: form.get('ms_due_date') as string,
    }

    if (editingMs) {
      await updateMilestone.mutateAsync({ id: editingMs.id, ...payload })
    } else {
      await createMilestone.mutateAsync({ goal_id: id, ...payload })
    }
    setMsDialogOpen(false)
    setEditingMs(null)
  }

  const handleMsProgressSave = (msId: string, value: number) => {
    updateMilestone.mutate(
      { id: msId, current_value: Math.max(0, value) },
      { onSuccess: () => setMsProgressEdit(null) }
    )
  }

  const handleMsDelete = (msId: string) => {
    if (!confirm('이 마일스톤을 삭제하시겠습니까?')) return
    deleteMilestone.mutate(msId)
  }

  if (!goal) {
    return <div className="max-w-3xl mx-auto animate-pulse"><div className="h-48 bg-card rounded-sm" /></div>
  }

  const progress = goal.target_value
    ? Math.min(100, Math.round(((goal.current_value ?? 0) / goal.target_value) * 100))
    : 0

  const daysLeft = goal.due_date
    ? Math.ceil((new Date(goal.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/goals" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft className="w-3.5 h-3.5" />
        목표 목록
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm flex items-center justify-center" style={{ backgroundColor: goal.color + '20' }}>
            <Target className="w-5 h-5" style={{ color: goal.color }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{goal.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{TYPE_LABELS[goal.type]}</Badge>
              <Badge variant="outline" className={goal.status === 'active' ? 'border-gatsaeng-teal text-gatsaeng-teal' : ''}>{goal.status}</Badge>
              {goal.core_value && <Badge variant="outline">{goal.core_value}</Badge>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-gatsaeng-red"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          {daysLeft !== null && (
            <div className="text-right">
              <div className={`text-2xl font-bold ${daysLeft <= 7 ? 'text-gatsaeng-red' : daysLeft <= 30 ? 'text-gatsaeng-amber' : 'text-foreground'}`}>
                D{daysLeft > 0 ? `-${daysLeft}` : daysLeft === 0 ? '-Day' : `+${Math.abs(daysLeft)}`}
              </div>
              <div className="text-xs text-muted-foreground">{goal.due_date?.slice(0, 10)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Progress Ring + Controls */}
      {goal.target_value && (
        <Card className="mb-6">
          <CardContent className="py-6">
            <div className="flex items-center gap-8">
              {/* SVG Ring */}
              <div className="relative w-32 h-32 flex-shrink-0">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" className="text-muted" strokeWidth="8" />
                  <circle
                    cx="64" cy="64" r="56" fill="none"
                    stroke={goal.color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold" style={{ color: goal.color }}>{progress}%</span>
                  <span className="text-[10px] text-muted-foreground">{goal.current_value ?? 0}/{goal.target_value}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex-1">
                <div className="text-sm text-muted-foreground mb-3">
                  진행 기록 ({goal.unit ?? '단위'})
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => handleUpdateProgress(-addAmount)}
                    disabled={(goal.current_value ?? 0) === 0}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    value={addAmount}
                    onChange={e => setAddAmount(Math.max(1, Number(e.target.value)))}
                    className="w-20 h-10 text-center"
                    min={1}
                  />
                  <Button
                    size="icon"
                    className="h-10 w-10 bg-gatsaeng-amber hover:bg-gatsaeng-amber/80 text-black"
                    onClick={() => handleUpdateProgress(addAmount)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {goal.target_value - (goal.current_value ?? 0) > 0
                    ? `목표까지 ${goal.target_value - (goal.current_value ?? 0)} ${goal.unit ?? ''} 남음`
                    : '목표 달성!'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestones */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Flag className="w-4 h-4 text-gatsaeng-amber" />
              마일스톤 ({milestones.length}/{LIMITS.MAX_MILESTONES_PER_GOAL})
            </CardTitle>
            <Dialog open={msDialogOpen} onOpenChange={(v) => { setMsDialogOpen(v); if (!v) setEditingMs(null) }}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={milestones.length >= LIMITS.MAX_MILESTONES_PER_GOAL}
                  onClick={() => setEditingMs(null)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  추가
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingMs ? '마일스톤 수정' : '마일스톤 추가'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleMilestoneSubmit} className="space-y-4">
                  <div>
                    <Label>제목</Label>
                    <Input name="ms_title" required placeholder="1차 중간점검" defaultValue={editingMs?.title ?? ''} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>목표치</Label>
                      <Input name="ms_target" type="number" required min={1} placeholder="50" defaultValue={editingMs?.target_value ?? ''} />
                    </div>
                    <div>
                      <Label>단위</Label>
                      <Input name="ms_unit" placeholder={goal.unit || '회, 권, 개'} defaultValue={editingMs?.unit ?? goal.unit ?? ''} />
                    </div>
                  </div>
                  <div>
                    <Label>마감일</Label>
                    <Input name="ms_due_date" type="date" required defaultValue={editingMs?.due_date?.slice(0, 10) ?? ''} />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gatsaeng-amber hover:bg-gatsaeng-amber/80 text-black"
                    disabled={createMilestone.isPending || updateMilestone.isPending}
                  >
                    {editingMs ? '수정' : '추가'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {milestones.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">
              아직 마일스톤이 없습니다. 목표를 단계별로 나눠보세요.
            </p>
          ) : (
            <div className="space-y-3">
              {milestones.map(m => {
                const msProgress = m.target_value > 0
                  ? Math.min(100, Math.round((m.current_value / m.target_value) * 100))
                  : 0
                const isEditing = msProgressEdit?.id === m.id
                return (
                  <div key={m.id} className="group flex items-center gap-3">
                    <div className={`text-sm font-bold font-mono min-w-[50px] text-right ${
                      m.d_day <= 0 ? 'text-gatsaeng-red' : m.d_day <= 7 ? 'text-gatsaeng-red' : m.d_day <= 30 ? 'text-gatsaeng-amber' : 'text-foreground'
                    }`}>
                      {m.d_day === 0 ? 'D-Day' : m.d_day > 0 ? `D-${m.d_day}` : `D+${Math.abs(m.d_day)}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-foreground truncate">{m.title}</div>
                      {isEditing ? (
                        <div className="flex items-center gap-1 mt-1">
                          <Input
                            type="number"
                            className="h-6 w-16 text-xs"
                            value={msProgressEdit.value}
                            onChange={e => setMsProgressEdit({ id: m.id, value: Number(e.target.value) })}
                            min={0}
                            max={m.target_value}
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleMsProgressSave(m.id, msProgressEdit.value)
                              if (e.key === 'Escape') setMsProgressEdit(null)
                            }}
                          />
                          <span className="text-[10px] text-muted-foreground">/ {m.target_value} {m.unit}</span>
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleMsProgressSave(m.id, msProgressEdit.value)}>
                            <Check className="w-3 h-3 text-gatsaeng-teal" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setMsProgressEdit(null)}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                          onClick={() => setMsProgressEdit({ id: m.id, value: m.current_value })}
                        >
                          {m.current_value}/{m.target_value} {m.unit} · {m.due_date.slice(0, 10)}
                        </div>
                      )}
                    </div>
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${msProgress}%`, backgroundColor: goal.color }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground min-w-[30px] text-right">{msProgress}%</span>
                    {/* Edit/Delete buttons - visible on hover */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => { setEditingMs(m); setMsDialogOpen(true) }}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:text-gatsaeng-red"
                        onClick={() => handleMsDelete(m.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Diagnosis */}
      {(goal.ai_diagnosis || goal.ai_direction) && (
        <Card className="mb-6 border-l-4 border-l-primary">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm flex items-center gap-2 text-primary">
              <Brain className="w-4 h-4" />
              AI 진단
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {goal.ai_diagnosis && <p className="text-sm text-foreground">{goal.ai_diagnosis}</p>}
            {goal.ai_direction && <p className="text-sm text-muted-foreground">{goal.ai_direction}</p>}
            {goal.ai_next_review && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Calendar className="w-3 h-3" />
                다음 리뷰: {goal.ai_next_review}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Neuroscience Cards */}
      <div className="grid grid-cols-1 gap-4">
        {goal.why_statement && (
          <Card className="border-l-4" style={{ borderLeftColor: '#7c5cbf' }}>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm flex items-center gap-2 text-gatsaeng-purple">
                <Brain className="w-4 h-4" />
                Why Statement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">{goal.why_statement}</p>
            </CardContent>
          </Card>
        )}

        {goal.identity_statement && (
          <Card className="border-l-4" style={{ borderLeftColor: '#58a6ff' }}>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm flex items-center gap-2 text-primary">
                <UserCircle className="w-4 h-4" />
                Identity Statement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground italic">&ldquo;{goal.identity_statement}&rdquo;</p>
            </CardContent>
          </Card>
        )}

        {goal.when_where_how && (
          <Card className="border-l-4" style={{ borderLeftColor: '#00d4aa' }}>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm flex items-center gap-2 text-gatsaeng-teal">
                <MapPin className="w-4 h-4" />
                Implementation Intention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">{goal.when_where_how}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
