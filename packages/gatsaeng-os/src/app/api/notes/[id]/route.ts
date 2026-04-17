import { NextResponse } from 'next/server'
import { safeJson, serverError } from '@/lib/safeJson'
import { getEntity, updateEntity, deleteEntity } from '@/lib/vault'
import { noteSchema } from '@/lib/vault/schemas'
import type { Note } from '@/types'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getEntity<Note>('notes', id, noteSchema)
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ...result.data, _content: result.content })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [body, _err] = await safeJson(request); if (_err) return _err
  const result = await updateEntity<Note>('notes', id, {
    ...body,
    updated_at: new Date().toISOString(),
  }, body.content)
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(result)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const deleted = await deleteEntity('notes', id)
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
