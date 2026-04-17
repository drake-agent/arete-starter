import { NextResponse } from 'next/server'
import { safeJson, serverError } from '@/lib/safeJson'
import { getEntity, updateEntity, deleteEntity } from '@/lib/vault'
import { taskSchema } from '@/lib/vault/schemas'
import type { Task } from '@/types'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getEntity<Task>('tasks', id, taskSchema)
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ...result.data, _content: result.content ?? '' })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [body, _err] = await safeJson(request); if (_err) return _err
  const { content: bodyContent, ...updates } = body
  const finalUpdates = { ...updates, updated_at: new Date().toISOString() }
  const result = await updateEntity<Task>('tasks', id, finalUpdates, bodyContent)
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(result)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const deleted = await deleteEntity('tasks', id)
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
