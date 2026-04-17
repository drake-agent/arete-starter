import { NextResponse } from 'next/server'
import { safeJson, serverError } from '@/lib/safeJson'
import { getEntity, updateEntity, deleteEntity } from '@/lib/vault'
import { routineSchema } from '@/lib/vault/schemas'
import type { Routine } from '@/types'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getEntity<Routine>('routines', id, routineSchema)
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(result.data)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [body, _err] = await safeJson(request); if (_err) return _err
  const result = await updateEntity<Routine>('routines', id, body)
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(result)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const deleted = await deleteEntity('routines', id)
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
