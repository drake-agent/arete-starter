import { NextResponse } from 'next/server'
import { getEntity, updateEntity, deleteEntity } from '@/lib/vault'
import { calendarEventSchema } from '@/lib/vault/schemas'
import type { CalendarEvent } from '@/types'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const entity = await getEntity<CalendarEvent>('calendar', id, calendarEventSchema)
  if (!entity) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(entity.data)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const result = await updateEntity<CalendarEvent>('calendar', id, body)
  return NextResponse.json(result)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await deleteEntity('calendar', id)
  return NextResponse.json({ ok: true })
}
