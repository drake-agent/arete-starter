'use client'

import { use, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Trash2, Square, CheckSquare } from 'lucide-react'
import { useTask, useUpdateTask, useDeleteTask } from '@/hooks/useProjects'
import { TiptapEditor } from '@/components/editor/TiptapEditor'
import { PinButton } from '@/components/shared/PinButton'
import { cn } from '@/lib/utils'
import type { TaskStatus, TaskPriority } from '@/types'

const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: '백로그',
  todo: '할 일',
  doing: '진행 중',
  done: '완료',
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: '긴급',
  high: '높음',
  medium: '보통',
  low: '낮음',
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: 'border-gatsaeng-red/50 text-gatsaeng-red',
  high: 'border-orange-500/50 text-orange-500',
  medium: 'border-gatsaeng-amber/50 text-gatsaeng-amber',
  low: 'border-muted-foreground/30 text-muted-foreground',
}

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: task, isLoading } = useTask(id)
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState('')

  const handleTitleSave = useCallback(() => {
    if (!task || !titleValue.trim()) return
    if (titleValue !== task.title) {
      updateTask.mutate({ id, title: titleValue })
    }
    setEditingTitle(false)
  }, [id, task, titleValue, updateTask])

  const handleContentSave = useCallback((markdown: string) => {
    updateTask.mutate({ id, content: markdown })
  }, [id, updateTask])

  const handleToggleDone = () => {
    if (!task) return
    updateTask.mutate({
      id,
      status: task.status === 'done' ? 'todo' : 'done',
    })
  }

  const handleDelete = () => {
    if (!confirm('이 할일을 삭제하시겠습니까?')) return
    deleteTask.mutate(id, {
      onSuccess: () => router.push('/tasks'),
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">할일을 찾을 수 없습니다</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/tasks')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> 돌아가기
        </Button>
      </div>
    )
  }

  const isDone = task.status === 'done'

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push('/tasks')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <button onClick={handleToggleDone} className="shrink-0">
          {isDone ? (
            <CheckSquare className="w-6 h-6 text-gatsaeng-teal" />
          ) : (
            <Square className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <Input
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave()
                if (e.key === 'Escape') setEditingTitle(false)
              }}
              autoFocus
              className="text-2xl font-bold h-auto py-1"
            />
          ) : (
            <h1
              className={cn(
                'text-2xl font-bold cursor-pointer hover:text-primary/80 transition-colors truncate',
                isDone ? 'line-through text-muted-foreground' : 'text-foreground'
              )}
              onDoubleClick={() => {
                setTitleValue(task.title)
                setEditingTitle(true)
              }}
              title="더블클릭하여 편집"
            >
              {task.title}
            </h1>
          )}
        </div>
        <PinButton type="task" id={id} title={task.title} size={20} />
        <Button variant="ghost" size="icon" onClick={handleDelete} className="text-muted-foreground hover:text-gatsaeng-red">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Properties */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">상태</label>
              <Select
                value={task.status}
                onValueChange={(v) => updateTask.mutate({ id, status: v as TaskStatus })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">우선순위</label>
              <Select
                value={task.priority}
                onValueChange={(v) => updateTask.mutate({ id, priority: v as TaskPriority })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">마감일</label>
              <Input
                type="date"
                value={task.due_date ?? ''}
                onChange={(e) => updateTask.mutate({ id, due_date: e.target.value || undefined })}
                className="h-8 text-sm"
              />
            </div>
            <div className="flex items-end">
              <Badge variant="outline" className={PRIORITY_COLORS[task.priority]}>
                {PRIORITY_LABELS[task.priority]}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editor */}
      <Card>
        <CardContent className="p-0">
          <TiptapEditor
            content={task._content ?? ''}
            onSave={handleContentSave}
            placeholder="상세 내용이나 메모를 입력하세요..."
          />
        </CardContent>
      </Card>
    </div>
  )
}
