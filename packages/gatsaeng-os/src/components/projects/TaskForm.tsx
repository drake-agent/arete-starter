'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { useGoals } from '@/hooks/useGoals'
import type { Task, TaskStatus, TaskPriority, EnergyLevel } from '@/types'

interface TaskFormProps {
  projectId: string
  defaultStatus?: TaskStatus
  onSubmit: (data: Partial<Task>) => Promise<void>
}

export function TaskForm({ projectId, defaultStatus = 'backlog', onSubmit }: TaskFormProps) {
  const [open, setOpen] = useState(false)
  const { data: goals } = useGoals()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const goalIds = form.get('goal_id') ? [form.get('goal_id') as string] : undefined
    await onSubmit({
      project_id: projectId,
      title: form.get('title') as string,
      description: (form.get('description') as string) || undefined,
      status: (form.get('status') as TaskStatus) || defaultStatus,
      priority: (form.get('priority') as TaskPriority) || 'medium',
      energy_required: (form.get('energy_required') as EnergyLevel) || undefined,
      tag: (form.get('tag') as string) || undefined,
      due_date: (form.get('due_date') as string) || undefined,
      goal_ids: goalIds,
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-gatsaeng-amber hover:bg-gatsaeng-amber/80 text-black">
          <Plus className="w-4 h-4 mr-1" /> 태스크 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>태스크 만들기</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>제목</Label>
            <Input name="title" required placeholder="태스크 제목" />
          </div>
          <div>
            <Label>설명</Label>
            <Input name="description" placeholder="태스크 설명 (선택)" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>상태</Label>
              <Select name="status" defaultValue={defaultStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="backlog">Backlog</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="doing">Doing</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>우선순위</Label>
              <Select name="priority" defaultValue="medium">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">긴급</SelectItem>
                  <SelectItem value="high">높음</SelectItem>
                  <SelectItem value="medium">보통</SelectItem>
                  <SelectItem value="low">낮음</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>에너지 요구</Label>
              <Select name="energy_required">
                <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">높음 ⚡</SelectItem>
                  <SelectItem value="medium">보통 🔋</SelectItem>
                  <SelectItem value="low">낮음 🪫</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>마감일</Label>
              <Input name="due_date" type="date" />
            </div>
          </div>
          <div>
            <Label>태그</Label>
            <Input name="tag" placeholder="예: frontend, design, bug" />
          </div>
          {(goals ?? []).length > 0 && (
            <div>
              <Label>연결 목표</Label>
              <Select name="goal_id">
                <SelectTrigger><SelectValue placeholder="목표 선택 (선택)" /></SelectTrigger>
                <SelectContent>
                  {(goals ?? []).map(goal => (
                    <SelectItem key={goal.id} value={goal.id}>{goal.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button type="submit" className="w-full bg-gatsaeng-amber hover:bg-gatsaeng-amber/80 text-black">
            태스크 생성
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
