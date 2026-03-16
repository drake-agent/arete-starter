import { NextResponse } from 'next/server'
import { listEntities, createEntity } from '@/lib/vault'
import { taskSchema } from '@/lib/vault/schemas'
import type { Task } from '@/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('project_id')
  const view = searchParams.get('view')
  const sort = searchParams.get('sort')

  const results = await listEntities<Task>('tasks', taskSchema)
  let tasks = results.map(r => ({ ...r.data, _content: r.content ?? '' }))

  if (projectId) {
    tasks = tasks.filter(t => t.project_id === projectId)
  }

  if (view) {
    const today = new Date().toISOString().split('T')[0]
    switch (view) {
      case 'inbox':
        tasks = tasks.filter(t => !t.due_date && t.status !== 'done')
        break
      case 'today':
        tasks = tasks.filter(t => t.due_date?.slice(0, 10) === today && t.status !== 'done')
        break
      case 'upcoming':
        tasks = tasks.filter(t => t.due_date && t.due_date.slice(0, 10) > today && t.status !== 'done')
        break
      case 'incomplete':
        tasks = tasks.filter(t => t.status !== 'done')
        break
      case 'done':
        tasks = tasks.filter(t => t.status === 'done')
        break
    }
  }

  if (sort === 'due_date') {
    tasks.sort((a, b) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999'))
  } else if (sort === 'priority') {
    const order: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
    tasks.sort((a, b) => (order[a.priority] ?? 2) - (order[b.priority] ?? 2))
  } else {
    tasks.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  }

  return NextResponse.json(tasks)
}

export async function POST(request: Request) {
  const body = await request.json()
  const now = new Date().toISOString()
  const data = {
    ...body,
    status: body.status ?? 'backlog',
    priority: body.priority ?? 'medium',
    position: body.position ?? 0,
    created_at: now,
    updated_at: now,
  }

  const entity = await createEntity<Task>('tasks', data)
  return NextResponse.json(entity, { status: 201 })
}
