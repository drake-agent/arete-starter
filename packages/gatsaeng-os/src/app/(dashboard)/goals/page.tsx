'use client'

import { useState } from 'react'
import { useGoals, useCreateGoal } from '@/hooks/useGoals'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { DDayBadge } from '@/components/tasks/DDayBadge'
import { Plus, Target } from 'lucide-react'
import Link from 'next/link'

const CORE_VALUES = ['성장', '자유', '관계', '건강', '재미', '안정', '창의']

export default function GoalsPage() {
  const { data: goals, isLoading } = useGoals()
  const createGoal = useCreateGoal()
  const [open, setOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    await createGoal.mutateAsync({
      title: form.get('title') as string,
      type: form.get('type') as string,
      target_value: Number(form.get('target_value')) || undefined,
      unit: (form.get('unit') as string) || undefined,
      why_statement: (form.get('why_statement') as string) || undefined,
      identity_statement: (form.get('identity_statement') as string) || undefined,
      when_where_how: (form.get('when_where_how') as string) || undefined,
      core_value: (form.get('core_value') as string) || undefined,
      due_date: (form.get('due_date') as string) || undefined,
    })
    setOpen(false)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">목표</h1>
          <p className="text-sm text-muted-foreground mt-1">Why로 시작하는 목표 관리</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gatsaeng-amber hover:bg-gatsaeng-amber/80 text-black">
              <Plus className="w-4 h-4 mr-2" /> 목표 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>목표 만들기</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>목표 제목</Label>
                <Input name="title" required placeholder="영어 비즈니스 레벨 달성" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>타입</Label>
                  <Select name="type" defaultValue="quarterly">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">연간</SelectItem>
                      <SelectItem value="quarterly">분기</SelectItem>
                      <SelectItem value="monthly">월간</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>마감일</Label>
                  <Input name="due_date" type="date" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>목표치</Label>
                  <Input name="target_value" type="number" placeholder="100" />
                </div>
                <div>
                  <Label>단위</Label>
                  <Input name="unit" placeholder="시간, 권, 개 등" />
                </div>
              </div>
              <div>
                <Label>왜 이 목표인가요? (Why Statement)</Label>
                <Input name="why_statement" placeholder="자유롭게 협업하고 커리어 선택지를 넓히기 위해" />
              </div>
              <div>
                <Label>어떤 사람이 되고 싶은가요? (Identity)</Label>
                <Input name="identity_statement" placeholder="나는 영어로 생각하는 사람이다" />
              </div>
              <div>
                <Label>언제, 어디서, 어떻게? (Implementation Intention)</Label>
                <Input name="when_where_how" placeholder="매일 아침 9시, 카페에서, 단어 20개 + 섀도잉 15분" />
              </div>
              <div>
                <Label>핵심 가치</Label>
                <Select name="core_value">
                  <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                  <SelectContent>
                    {CORE_VALUES.map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-gatsaeng-amber hover:bg-gatsaeng-amber/80 text-black">
                목표 생성
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-card rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(goals ?? []).map(goal => {
            const progress = goal.target_value
              ? Math.round(((goal.current_value ?? 0) / goal.target_value) * 100)
              : 0
            return (
              <Link key={goal.id} href={`/goals/${goal.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="w-4 h-4" style={{ color: goal.color }} />
                      <span className="truncate">{goal.title}</span>
                    </CardTitle>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {goal.due_date && <DDayBadge dueDate={goal.due_date} />}
                      <Badge variant="outline">{goal.type}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {goal.target_value && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{goal.current_value ?? 0} / {goal.target_value} {goal.unit}</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${progress}%`, backgroundColor: goal.color }}
                        />
                      </div>
                    </div>
                  )}
                  {goal.why_statement && (
                    <p className="text-xs text-muted-foreground">
                      Why: {goal.why_statement}
                    </p>
                  )}
                  {goal.core_value && (
                    <Badge className="mt-2 text-xs" variant="outline">{goal.core_value}</Badge>
                  )}
                </CardContent>
              </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
