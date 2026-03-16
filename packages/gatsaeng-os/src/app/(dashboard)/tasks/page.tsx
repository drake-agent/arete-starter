'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useGlobalTasks, useQuickCreateTask, useToggleTaskDone } from '@/hooks/useGlobalTasks'
import { useProjects } from '@/hooks/useProjects'
import { DDayBadge } from '@/components/tasks/DDayBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Inbox,
  CalendarCheck,
  CalendarClock,
  ListTodo,
  CheckCircle2,
  Circle,
  Plus,
  ArrowUpDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task, TaskPriority } from '@/types'

const VIEW_TABS = [
  { value: 'inbox', label: 'Inbox', icon: Inbox },
  { value: 'today', label: '오늘', icon: CalendarCheck },
  { value: 'upcoming', label: '예정', icon: CalendarClock },
  { value: 'incomplete', label: '미완료', icon: ListTodo },
  { value: 'done', label: '완료', icon: CheckCircle2 },
] as const

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: 'bg-gatsaeng-red text-white',
  high: 'bg-gatsaeng-red/70 text-white',
  medium: 'bg-gatsaeng-amber/80 text-black',
  low: 'bg-muted text-muted-foreground',
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: '긴급',
  high: '높음',
  medium: '보통',
  low: '낮음',
}

export default function TasksPage() {
  const [view, setView] = useState('inbox')
  const [sort, setSort] = useState<string>('')
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickTitle, setQuickTitle] = useState('')
  const [quickDueDate, setQuickDueDate] = useState('')
  const [quickProjectId, setQuickProjectId] = useState('')

  const { data: tasks = [], isLoading } = useGlobalTasks(view, sort || undefined)
  const { data: projects = [] } = useProjects()
  const quickCreate = useQuickCreateTask()
  const toggleDone = useToggleTaskDone()

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickTitle.trim()) return
    await quickCreate.mutateAsync({
      title: quickTitle.trim(),
      due_date: quickDueDate || undefined,
      project_id: quickProjectId || undefined,
    })
    setQuickTitle('')
    setQuickDueDate('')
    setQuickProjectId('')
    setShowQuickAdd(false)
  }

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.title ?? ''
  }

  const groupedTasks = useMemo(() => {
    if (view === 'inbox' || view === 'done') return null // no date grouping for these
    const today = new Date().toISOString().slice(0, 10)
    const weekLater = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)

    const groups: { label: string; tasks: Task[] }[] = []
    const overdue: Task[] = []
    const todayTasks: Task[] = []
    const thisWeek: Task[] = []
    const later: Task[] = []
    const noDue: Task[] = []

    for (const t of tasks) {
      const d = t.due_date?.slice(0, 10)
      if (!d) { noDue.push(t); continue }
      if (d < today) overdue.push(t)
      else if (d === today) todayTasks.push(t)
      else if (d <= weekLater) thisWeek.push(t)
      else later.push(t)
    }

    if (overdue.length) groups.push({ label: `지난 할일 ${overdue.length}`, tasks: overdue })
    if (todayTasks.length) groups.push({ label: `오늘 ${todayTasks.length}`, tasks: todayTasks })
    if (thisWeek.length) groups.push({ label: `다음 7일 ${thisWeek.length}`, tasks: thisWeek })
    if (later.length) groups.push({ label: `이후 ${later.length}`, tasks: later })
    if (noDue.length) groups.push({ label: `마감일 없음 ${noDue.length}`, tasks: noDue })

    return groups.length > 0 ? groups : null
  }, [tasks, view])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">할일</h1>
          <p className="text-sm text-muted-foreground mt-1">스마트 뷰로 태스크 관리</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <ArrowUpDown className="w-3 h-3 mr-1" />
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="position">기본</SelectItem>
              <SelectItem value="due_date">마감일순</SelectItem>
              <SelectItem value="priority">우선순위순</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/80"
            onClick={() => setShowQuickAdd(v => !v)}
          >
            <Plus className="w-4 h-4 mr-1" /> 추가
          </Button>
        </div>
      </div>

      {showQuickAdd && (
        <Card className="mb-4 border-primary/30">
          <CardContent className="py-3 px-4">
            <form onSubmit={handleQuickAdd} className="flex items-center gap-2">
              <Input
                value={quickTitle}
                onChange={e => setQuickTitle(e.target.value)}
                placeholder="새 할일 입력..."
                className="flex-1 h-8 text-sm"
                autoFocus
              />
              <Input
                type="date"
                value={quickDueDate}
                onChange={e => setQuickDueDate(e.target.value)}
                className="w-[140px] h-8 text-xs"
              />
              <Select value={quickProjectId} onValueChange={setQuickProjectId}>
                <SelectTrigger className="w-[130px] h-8 text-xs">
                  <SelectValue placeholder="프로젝트" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">없음</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" size="sm" disabled={quickCreate.isPending}>
                추가
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Tabs value={view} onValueChange={setView} className="mb-6">
        <TabsList>
          {VIEW_TABS.map(tab => {
            const Icon = tab.icon
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-14 bg-card rounded-lg animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {view === 'inbox' && '프로젝트에 배정되지 않은 할일이 없습니다'}
            {view === 'today' && '오늘 마감인 할일이 없습니다'}
            {view === 'upcoming' && '예정된 할일이 없습니다'}
            {view === 'incomplete' && '미완료 할일이 없습니다'}
            {view === 'done' && '완료된 할일이 없습니다'}
          </CardContent>
        </Card>
      ) : groupedTasks ? (
        <div className="space-y-4">
          {groupedTasks.map(group => (
            <div key={group.label}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-muted-foreground">▼ {group.label}</span>
              </div>
              <div className="space-y-1.5">
                {group.tasks.map(task => (
                  <TaskListItem
                    key={task.id}
                    task={task}
                    projectName={getProjectName(task.project_id)}
                    onToggle={() => toggleDone.mutate({ id: task.id, currentStatus: task.status })}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {tasks.map(task => (
            <TaskListItem
              key={task.id}
              task={task}
              projectName={getProjectName(task.project_id)}
              onToggle={() => toggleDone.mutate({ id: task.id, currentStatus: task.status })}
            />
          ))}
        </div>
      )}

      {!isLoading && tasks.length > 0 && (
        <div className="mt-4 text-xs text-muted-foreground text-right">
          {tasks.length}개 태스크
        </div>
      )}
    </div>
  )
}

function TaskListItem({ task, projectName, onToggle }: {
  task: Task
  projectName: string
  onToggle: () => void
}) {
  const router = useRouter()
  const isDone = task.status === 'done'

  return (
    <Card
      className={cn(
        'group hover:border-primary/30 transition-colors cursor-pointer',
        isDone && 'opacity-60'
      )}
      onClick={() => router.push(`/tasks/${task.id}`)}
    >
      <CardContent className="py-2.5 px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); onToggle() }}
            className="flex-shrink-0 transition-colors"
          >
            {isDone ? (
              <CheckCircle2 className="w-5 h-5 text-primary" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground hover:text-primary" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn(
                'text-sm font-medium truncate',
                isDone && 'line-through text-muted-foreground'
              )}>
                {task.title}
              </span>
            </div>
            {(projectName || task.tag) && (
              <div className="flex items-center gap-2 mt-0.5">
                {projectName && (
                  <span className="text-[10px] text-muted-foreground">{projectName}</span>
                )}
                {task.tag && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0">{task.tag}</Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={cn('text-[10px] px-1.5 py-0', PRIORITY_COLORS[task.priority])}>
              {PRIORITY_LABELS[task.priority]}
            </Badge>
            {task.due_date && <DDayBadge dueDate={task.due_date} />}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
