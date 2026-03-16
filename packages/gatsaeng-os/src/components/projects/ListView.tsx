'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import type { Task, TaskStatus } from '@/types'

const STATUS_ICONS: Record<string, string> = {
  backlog: '○',
  todo: '◐',
  doing: '◑',
  done: '●',
}

interface ListViewProps {
  tasks: Task[]
  onUpdateTask: (data: { id: string; status: TaskStatus }) => void
}

export function ListView({ tasks, onUpdateTask }: ListViewProps) {
  const grouped = {
    doing: tasks.filter(t => t.status === 'doing'),
    todo: tasks.filter(t => t.status === 'todo'),
    backlog: tasks.filter(t => t.status === 'backlog'),
    done: tasks.filter(t => t.status === 'done'),
  }

  const sections = [
    { key: 'doing', title: '진행중', tasks: grouped.doing },
    { key: 'todo', title: '할 일', tasks: grouped.todo },
    { key: 'backlog', title: '백로그', tasks: grouped.backlog },
    { key: 'done', title: '완료', tasks: grouped.done },
  ]

  return (
    <div className="space-y-6">
      {sections.map(section => (
        section.tasks.length > 0 && (
          <div key={section.key}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {section.title}
              </span>
              <Badge variant="outline" className="text-xs">{section.tasks.length}</Badge>
            </div>
            <div className="space-y-1">
              {section.tasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-secondary/30 transition-colors group"
                >
                  <Checkbox
                    checked={task.status === 'done'}
                    onCheckedChange={(checked) => {
                      onUpdateTask({
                        id: task.id,
                        status: checked ? 'done' : 'todo',
                      })
                    }}
                  />
                  <span className={`text-sm flex-1 ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                    {task.title}
                  </span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge variant="outline" className="text-[10px]">{task.priority}</Badge>
                    {task.due_date && (
                      <span className="text-[10px] text-muted-foreground">{task.due_date.slice(0, 10)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ))}
      {tasks.length === 0 && (
        <div className="text-center text-muted-foreground py-8 text-sm">
          아직 태스크가 없습니다
        </div>
      )}
    </div>
  )
}
