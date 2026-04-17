import { NextResponse } from 'next/server'
import { safeJson, serverError } from '@/lib/safeJson'
import { getEntity, updateEntity, deleteEntity } from '@/lib/vault'
import { areaSchema } from '@/lib/vault/schemas'
import type { Area } from '@/types'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = await getEntity<Area>('areas', id, areaSchema)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item.data)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [body, _err] = await safeJson(req); if (_err) return _err
  const updated = await updateEntity<Area>('areas', id, body)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ok = await deleteEntity('areas', id)
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
