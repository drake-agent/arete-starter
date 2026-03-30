'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowUpDown, Search } from 'lucide-react'
import type { Task, TaskStatus, TaskPriority } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  backlog: 'text-muted-foreground',
  todo: 'text-primary',
  doing: 'text-gatsaeng-amber',
  done: 'text-gatsaeng-teal',
}

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
}

type SortKey = 'title' | 'status' | 'priority' | 'due_date'
type SortDir = 'asc' | 'desc'

interface TableViewProps {
  tasks: Task[]
  onClickTask?: (task: Task) => void
  onUpdateTask: (data: { id: string; status: TaskStatus }) => void
}

export function TableView({ tasks, onClickTask, onUpdateTask }: TableViewProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('priority')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filtered = useMemo(() => {
    let result = tasks

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(t => t.title.toLowerCase().includes(q) || t.tag?.toLowerCase().includes(q))
    }
    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter)
    }
    if (priorityFilter !== 'all') {
      result = result.filter(t => t.priority === priorityFilter)
    }

    result = [...result].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      switch (sortKey) {
        case 'title':
          return dir * a.title.localeCompare(b.title)
        case 'status': {
          const order = ['backlog', 'todo', 'doing', 'done']
          return dir * (order.indexOf(a.status) - order.indexOf(b.status))
        }
        case 'priority':
          return dir * (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
        case 'due_date':
          return dir * ((a.due_date ?? '').localeCompare(b.due_date ?? ''))
        default:
          return 0
      }
    })

    return result
  }, [tasks, search, statusFilter, priorityFilter, sortKey, sortDir])

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <button
      onClick={() => toggleSort(sortKeyName)}
      className="flex min-h-[44px] items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
    >
      {label}
      <ArrowUpDown className={`h-3 w-3 ${sortKey === sortKeyName ? 'text-primary' : ''}`} />
    </button>
  )

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="검색..."
            className="h-10 pl-8 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 w-full text-xs sm:w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="backlog">Backlog</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="doing">Doing</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="h-10 w-full text-xs sm:w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 우선</SelectItem>
            <SelectItem value="urgent">긴급</SelectItem>
            <SelectItem value="high">높음</SelectItem>
            <SelectItem value="medium">보통</SelectItem>
            <SelectItem value="low">낮음</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-sm border border-border">
        <table className="min-w-[720px] w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="px-4 py-2.5 text-left">
                <SortHeader label="제목" sortKeyName="title" />
              </th>
              <th className="w-24 px-4 py-2.5 text-left">
                <SortHeader label="상태" sortKeyName="status" />
              </th>
              <th className="w-24 px-4 py-2.5 text-left">
                <SortHeader label="우선순위" sortKeyName="priority" />
              </th>
              <th className="w-20 px-4 py-2.5 text-left">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">에너지</span>
              </th>
              <th className="w-28 px-4 py-2.5 text-left">
                <SortHeader label="마감일" sortKeyName="due_date" />
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {search || statusFilter !== 'all' || priorityFilter !== 'all'
                    ? '필터에 맞는 태스크가 없습니다'
                    : '아직 태스크가 없습니다'}
                </td>
              </tr>
            ) : (
              filtered.map(task => (
                <tr
                  key={task.id}
                  className="cursor-pointer border-b border-border/50 transition-colors last:border-0 hover:bg-secondary/20"
                  onClick={() => onClickTask?.(task)}
                >
                  <td className="px-4 py-2.5">
                    <div className="text-sm">{task.title}</div>
                    {task.tag && (
                      <Badge variant="outline" className="mt-1 text-[10px]">{task.tag}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <Select
                      value={task.status}
                      onValueChange={(v) => {
                        onUpdateTask({ id: task.id, status: v as TaskStatus })
                      }}
                    >
                      <SelectTrigger className={`h-9 w-20 border-0 bg-transparent text-xs ${STATUS_COLORS[task.status]}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="backlog">Backlog</SelectItem>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="doing">Doing</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className="text-[10px]">{task.priority}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {task.energy_required ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {task.due_date?.slice(0, 10) ?? '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
