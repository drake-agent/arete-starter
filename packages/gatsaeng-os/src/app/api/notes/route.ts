import { NextResponse } from 'next/server'
import { listEntities, createEntity } from '@/lib/vault'
import { noteSchema } from '@/lib/vault/schemas'
import type { Note } from '@/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const areaId = searchParams.get('area_id')

  const results = await listEntities<Note>('notes', noteSchema)
  let notes = results.map(r => ({ ...r.data, _content: r.content }))

  if (type) notes = notes.filter(n => n.type === type)
  if (areaId) notes = notes.filter(n => n.area_id === areaId)

  notes.sort((a, b) => a.priority - b.priority || b.created_at.localeCompare(a.created_at))

  return NextResponse.json(notes)
}

export async function POST(request: Request) {
  const body = await request.json()
  const now = new Date().toISOString()
  const note = await createEntity<Note>('notes', {
    title: body.title,
    type: body.type || 'note',
    priority: body.priority || 2,
    area_id: body.area_id,
    project_id: body.project_id,
    url: body.url,
    created_at: now,
    updated_at: now,
  }, body.content)

  return NextResponse.json(note, { status: 201 })
}
