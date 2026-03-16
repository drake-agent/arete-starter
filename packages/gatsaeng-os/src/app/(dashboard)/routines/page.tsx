'use client'

import { useState } from 'react'
import { useRoutines, useToggleRoutine } from '@/hooks/useRoutines'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Zap, Flame, ArrowDown, Clock, MapPin, Bell, Trophy, Trash2, Pause, Play, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RoutineWithStatus, TriggerType, EnergyLevel } from '@/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'

const TRIGGER_ICONS: Record<string, React.ReactNode> = {
  time: <Clock className="w-3 h-3" />,
  event: <Bell className="w-3 h-3" />,
  location: <MapPin className="w-3 h-3" />,
}

export default function RoutinesPage() {
  const { chains, routines, isLoading } = useRoutines()
  const toggleMutation = useToggleRoutine()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingRoutine, setEditingRoutine] = useState<RoutineWithStatus | null>(null)
  const [showReward, setShowReward] = useState<string | null>(null)
  const [routineTab, setRoutineTab] = useState('active')

  const createRoutine = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] })
      setOpen(false)
    },
  })

  const deleteRoutine = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/routines/${id}`, { method: 'DELETE' })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] })
    },
  })

  const updateRoutine = useMutation({
    mutationFn: async ({ id, ...data }: Record<string, unknown> & { id: string }) => {
      const res = await fetch(`/api/routines/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] })
      setEditOpen(false)
      setEditingRoutine(null)
    },
  })

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingRoutine) return
    const form = new FormData(e.currentTarget)
    await updateRoutine.mutateAsync({
      id: editingRoutine.id,
      title: form.get('title') as string,
      trigger_type: form.get('trigger_type') as TriggerType,
      trigger_cue: (form.get('trigger_cue') as string) || undefined,
      energy_required: form.get('energy_required') as EnergyLevel,
      reward_note: (form.get('reward_note') as string) || undefined,
    })
  }

  const handleToggleActive = (routine: RoutineWithStatus) => {
    updateRoutine.mutate({ id: routine.id, is_active: !routine.is_active })
  }

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`"${title}" 루틴을 삭제하시겠습니까?`)) return
    deleteRoutine.mutate(id)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    await createRoutine.mutateAsync({
      title: form.get('title') as string,
      trigger_type: form.get('trigger_type') as TriggerType,
      trigger_cue: (form.get('trigger_cue') as string) || undefined,
      energy_required: form.get('energy_required') as EnergyLevel,
      reward_note: (form.get('reward_note') as string) || undefined,
      after_routine_id: (form.get('after_routine_id') as string) || undefined,
    })
  }

  const handleToggle = (routine: RoutineWithStatus) => {
    toggleMutation.mutate({ routineId: routine.id, completed: routine.completed_today })
    // Show reward note briefly when completing
    if (!routine.completed_today && routine.reward_note) {
      setShowReward(routine.id)
      setTimeout(() => setShowReward(null), 3000)
    }
  }

  // Filter by active/stopped
  const activeRoutines = routines.filter(r => r.is_active !== false)
  const stoppedRoutines = routines.filter(r => r.is_active === false)
  const filteredChains = routineTab === 'active'
    ? chains.map(c => c.filter(r => r.is_active !== false)).filter(c => c.length > 0)
    : chains.map(c => c.filter(r => r.is_active === false)).filter(c => c.length > 0)

  // Stats
  const totalRoutines = activeRoutines.length
  const completedToday = activeRoutines.filter(r => r.completed_today).length
  const totalStreak = activeRoutines.reduce((max, r) => Math.max(max, r.streak), 0)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">루틴</h1>
          <p className="text-sm text-muted-foreground mt-1">습관 스택킹으로 루틴 체인 만들기</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gatsaeng-teal hover:bg-gatsaeng-teal/80 text-black">
              <Plus className="w-4 h-4 mr-2" /> 루틴 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>루틴 만들기</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>루틴 이름</Label>
                <Input name="title" required placeholder="명상 10분" />
              </div>
              <div>
                <Label>트리거 타입</Label>
                <Select name="trigger_type" defaultValue="event">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time">시간 기준</SelectItem>
                    <SelectItem value="event">이벤트 기준</SelectItem>
                    <SelectItem value="location">장소 기준</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>트리거 큐</Label>
                <Input name="trigger_cue" placeholder="기상 직후 / 점심 식사 후 / 퇴근 후 집 도착 시" />
              </div>
              <div>
                <Label>앞 루틴 (습관 스택킹)</Label>
                <Select name="after_routine_id">
                  <SelectTrigger><SelectValue placeholder="없음" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">없음</SelectItem>
                    {routines.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>에너지 소모</Label>
                <Select name="energy_required" defaultValue="medium">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">낮음</SelectItem>
                    <SelectItem value="medium">중간</SelectItem>
                    <SelectItem value="high">높음</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>완료 후 나에게 하는 말</Label>
                <Input name="reward_note" placeholder="오늘도 내 뇌를 위한 투자를 했다" />
              </div>
              <Button type="submit" className="w-full bg-gatsaeng-teal hover:bg-gatsaeng-teal/80 text-black">
                루틴 생성
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={routineTab} onValueChange={setRoutineTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="active">활성 ({activeRoutines.length})</TabsTrigger>
          <TabsTrigger value="stopped">중단 ({stoppedRoutines.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Daily Stats Bar */}
      {totalRoutines > 0 && (
        <div className="flex items-center gap-4 mb-6 p-3 bg-card rounded-lg border border-border">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>오늘 진행률</span>
              <span>{completedToday}/{totalRoutines}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gatsaeng-teal rounded-full transition-all duration-500"
                style={{ width: `${totalRoutines > 0 ? (completedToday / totalRoutines) * 100 : 0}%` }}
              />
            </div>
          </div>
          {totalStreak > 0 && (
            <div className="flex items-center gap-1.5 text-gatsaeng-amber">
              <Flame className="w-4 h-4" />
              <span className="text-sm font-bold">{totalStreak}</span>
              <span className="text-xs text-muted-foreground">최고 연속</span>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-card rounded-lg animate-pulse" />)}
        </div>
      ) : filteredChains.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {routineTab === 'active' ? '활성 루틴이 없습니다. 루틴을 추가해보세요.' : '중단된 루틴이 없습니다.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {filteredChains.map((chain, chainIdx) => {
            const chainComplete = chain.every(r => r.completed_today)
            return (
              <div key={chainIdx}>
                {/* Chain Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold',
                    chainComplete ? 'bg-gatsaeng-teal/20 text-gatsaeng-teal' : 'bg-secondary text-muted-foreground'
                  )}>
                    {chainComplete ? <Trophy className="w-3 h-3" /> : chainIdx + 1}
                  </div>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    Chain {chainIdx + 1}
                  </span>
                  {chainComplete && (
                    <Badge className="text-[10px] bg-gatsaeng-teal/10 text-gatsaeng-teal border-gatsaeng-teal/30">
                      완료!
                    </Badge>
                  )}
                </div>

                {/* Chain Items with Visual Connector */}
                <div className="relative">
                  {chain.map((routine, i) => (
                    <div key={routine.id}>
                      {/* Arrow connector between items */}
                      {i > 0 && (
                        <div className="flex items-center justify-center py-1">
                          <ArrowDown className={cn(
                            'w-3.5 h-3.5',
                            chain[i - 1].completed_today ? 'text-gatsaeng-teal' : 'text-muted-foreground/30'
                          )} />
                        </div>
                      )}

                      <Card className={cn(
                        'transition-all duration-300 group',
                        routine.completed_today && 'border-gatsaeng-teal/30 bg-gatsaeng-teal/5',
                        !routine.completed_today && i > 0 && chain[i - 1].completed_today && 'ring-1 ring-gatsaeng-amber/50'
                      )}>
                        <CardContent className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={routine.completed_today}
                              onCheckedChange={() => handleToggle(routine)}
                              className="data-[state=checked]:bg-gatsaeng-teal data-[state=checked]:border-gatsaeng-teal"
                            />
                            <div className="flex-1 min-w-0">
                              <div className={cn(
                                'text-sm font-medium',
                                routine.completed_today && 'line-through text-muted-foreground'
                              )}>
                                {routine.title}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                {routine.trigger_cue && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        {TRIGGER_ICONS[routine.trigger_type]}
                                        <span className="truncate max-w-[200px]">{routine.trigger_cue}</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>{routine.trigger_cue}</TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Zap className={cn(
                                'w-3 h-3',
                                routine.energy_required === 'high' ? 'text-gatsaeng-red' :
                                routine.energy_required === 'medium' ? 'text-gatsaeng-amber' :
                                'text-gatsaeng-teal'
                              )} />
                              {routine.streak > 0 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1">
                                      <Flame className={cn(
                                        'w-3.5 h-3.5',
                                        routine.streak >= 7 ? 'text-gatsaeng-red' :
                                        routine.streak >= 3 ? 'text-gatsaeng-amber' :
                                        'text-muted-foreground'
                                      )} />
                                      <span className="text-xs font-bold text-gatsaeng-amber">
                                        {routine.streak}
                                      </span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {routine.streak}일 연속 (최고: {routine.longest_streak}일)
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingRoutine(routine); setEditOpen(true) }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-primary/10 rounded"
                              >
                                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleToggleActive(routine) }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gatsaeng-amber/10 rounded"
                                title={routine.is_active ? '중단' : '재개'}
                              >
                                {routine.is_active !== false ? <Pause className="w-3.5 h-3.5 text-gatsaeng-amber" /> : <Play className="w-3.5 h-3.5 text-gatsaeng-teal" />}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(routine.id, routine.title) }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-gatsaeng-red" />
                              </button>
                            </div>
                          </div>

                          {/* Reward Note Animation */}
                          {showReward === routine.id && routine.reward_note && (
                            <div className="mt-2 p-2 bg-gatsaeng-teal/10 rounded-md border border-gatsaeng-teal/20 text-xs text-gatsaeng-teal animate-in fade-in slide-in-from-top-1 duration-300">
                              &ldquo;{routine.reward_note}&rdquo;
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) setEditingRoutine(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>루틴 수정</DialogTitle>
          </DialogHeader>
          {editingRoutine && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <Label>루틴 이름</Label>
                <Input name="title" required defaultValue={editingRoutine.title} />
              </div>
              <div>
                <Label>트리거 타입</Label>
                <Select name="trigger_type" defaultValue={editingRoutine.trigger_type}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time">시간 기준</SelectItem>
                    <SelectItem value="event">이벤트 기준</SelectItem>
                    <SelectItem value="location">장소 기준</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>트리거 큐</Label>
                <Input name="trigger_cue" defaultValue={editingRoutine.trigger_cue ?? ''} placeholder="기상 직후 / 점심 식사 후" />
              </div>
              <div>
                <Label>에너지 소모</Label>
                <Select name="energy_required" defaultValue={editingRoutine.energy_required}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">낮음</SelectItem>
                    <SelectItem value="medium">중간</SelectItem>
                    <SelectItem value="high">높음</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>완료 후 나에게 하는 말</Label>
                <Input name="reward_note" defaultValue={editingRoutine.reward_note ?? ''} placeholder="오늘도 내 뇌를 위한 투자를 했다" />
              </div>
              <Button type="submit" disabled={updateRoutine.isPending} className="w-full bg-gatsaeng-teal hover:bg-gatsaeng-teal/80 text-black">
                수정 완료
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
