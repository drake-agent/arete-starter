'use client'

import { use, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTasks, useCreateTask, useUpdateTask } from '@/hooks/useProjects'
import { ViewSwitcher } from '@/components/projects/ViewSwitcher'
import { TaskForm } from '@/components/projects/TaskForm'
import { KanbanView } from '@/components/projects/KanbanView'
import { TableView } from '@/components/projects/TableView'
import { ListView } from '@/components/projects/ListView'
import { CalendarView } from '@/components/projects/CalendarView'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Project, Task, ViewType, TaskStatus } from '@/types'

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: async (): Promise<Project> => {
      const res = await fetch(`/api/projects/${id}`)
      return res.json()
    },
  })

  const { data: tasks } = useTasks(id)
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  const [view, setView] = useState<ViewType>(project?.default_view ?? 'kanban')

  const handleCreateTask = async (data: Partial<Task>) => {
    await createTask.mutateAsync(data)
  }

  const handleUpdateTask = (data: { id: string; status: TaskStatus; position?: number }) => {
    updateTask.mutate(data)
  }

  const allTasks = tasks ?? []

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link href="/projects" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3">
          <ArrowLeft className="w-3.5 h-3.5" />
          프로젝트 목록
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{project?.title ?? '...'}</h1>
              {project && <Badge variant="outline">{project.status}</Badge>}
            </div>
            {project?.description && (
              <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <ViewSwitcher value={view} onChange={setView} />
            <TaskForm
              projectId={id}
              defaultStatus={view === 'kanban' ? 'backlog' : 'todo'}
              onSubmit={handleCreateTask}
            />
          </div>
        </div>
      </div>

      {view === 'kanban' && (
        <KanbanView tasks={allTasks} onUpdateTask={handleUpdateTask} />
      )}
      {view === 'table' && (
        <TableView tasks={allTasks} onUpdateTask={handleUpdateTask} />
      )}
      {view === 'list' && (
        <ListView tasks={allTasks} onUpdateTask={handleUpdateTask} />
      )}
      {view === 'calendar' && (
        <CalendarView tasks={allTasks} />
      )}
    </div>
  )
}
