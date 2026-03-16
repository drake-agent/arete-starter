import { NextResponse } from 'next/server'
import { listEntities, createEntity } from '@/lib/vault'
import { projectSchema } from '@/lib/vault/schemas'
import type { Project } from '@/types'

export async function GET() {
  const results = await listEntities<Project>('projects', projectSchema)
  return NextResponse.json(results.map(r => r.data))
}

export async function POST(request: Request) {
  const body = await request.json()
  const now = new Date().toISOString()
  const data = {
    ...body,
    status: body.status ?? 'active',
    color: body.color ?? '#7c5cbf',
    default_view: body.default_view ?? 'kanban',
    created_at: now,
    updated_at: now,
  }

  const entity = await createEntity<Project>('projects', data)
  return NextResponse.json(entity, { status: 201 })
}
