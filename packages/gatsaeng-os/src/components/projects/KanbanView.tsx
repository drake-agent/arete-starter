'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from '@/components/ui/badge'
import { TaskCard } from './TaskCard'
import type { Task, TaskStatus } from '@/types'

const COLUMNS: { key: TaskStatus; title: string; color: string }[] = [
  { key: 'backlog', title: 'Backlog', color: '#8b949e' },
  { key: 'todo', title: 'To Do', color: '#58a6ff' },
  { key: 'doing', title: 'Doing', color: '#f5a623' },
  { key: 'done', title: 'Done', color: '#00d4aa' },
]

interface KanbanViewProps {
  tasks: Task[]
  onUpdateTask: (data: { id: string; status: TaskStatus; position: number }) => void
}

function SortableTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <TaskCard
      ref={setNodeRef}
      task={task}
      isDragging={isDragging}
      dragHandleProps={{ ...attributes, ...listeners }}
      style={style}
    />
  )
}

function KanbanColumn({ column, tasks }: { column: typeof COLUMNS[number]; tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key })

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[240px] rounded-sm p-2 transition-colors ${
        isOver ? 'bg-primary/5 ring-1 ring-primary/20' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: column.color }} />
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {column.title}
        </span>
        <Badge variant="outline" className="text-xs ml-auto">{tasks.length}</Badge>
      </div>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[100px]">
          {tasks.map(task => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

export function KanbanView({ tasks, onUpdateTask }: KanbanViewProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const tasksByColumn = COLUMNS.reduce(
    (acc, col) => {
      acc[col.key] = tasks.filter(t => t.status === col.key).sort((a, b) => a.position - b.position)
      return acc
    },
    {} as Record<TaskStatus, Task[]>
  )

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find(t => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  function findColumn(id: string): TaskStatus | undefined {
    // Check if the id is a column key
    if (COLUMNS.some(c => c.key === id)) return id as TaskStatus
    // Otherwise find which column contains this task
    const task = tasks.find(t => t.id === id)
    return task?.status
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeColumn = findColumn(active.id as string)
    const overColumn = findColumn(over.id as string)

    if (!activeColumn || !overColumn || activeColumn === overColumn) return

    // Moving to a new column
    const task = tasks.find(t => t.id === active.id)
    if (task) {
      const targetTasks = tasksByColumn[overColumn]
      onUpdateTask({
        id: task.id,
        status: overColumn,
        position: targetTasks.length,
      })
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const overColumn = findColumn(over.id as string)
    if (!overColumn) return

    const task = tasks.find(t => t.id === active.id)
    if (!task) return

    // Calculate new position
    const columnTasks = tasksByColumn[overColumn].filter(t => t.id !== task.id)
    const overIndex = columnTasks.findIndex(t => t.id === over.id)
    const newPosition = overIndex >= 0 ? overIndex : columnTasks.length

    onUpdateTask({
      id: task.id,
      status: overColumn,
      position: newPosition,
    })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => (
          <KanbanColumn key={col.key} column={col} tasks={tasksByColumn[col.key]} />
        ))}
      </div>
      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} isDragging />}
      </DragOverlay>
    </DndContext>
  )
}
