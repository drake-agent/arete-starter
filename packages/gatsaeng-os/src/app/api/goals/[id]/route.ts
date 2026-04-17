import { NextResponse } from 'next/server'
import { safeJson, serverError } from '@/lib/safeJson'
import { getEntity, updateEntity, deleteEntity } from '@/lib/vault'
import { goalSchema } from '@/lib/vault/schemas'
import type { Goal } from '@/types'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getEntity<Goal>('goals', id, goalSchema)
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ...result.data, _content: result.content })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [body, _err] = await safeJson(request); if (_err) return _err
  const updates = { ...body, updated_at: new Date().toISOString() }

  const sections: string[] = []
  if (body.why_statement) sections.push(`## Why Statement\n${body.why_statement}`)
  if (body.identity_statement) sections.push(`## Identity Statement\n${body.identity_statement}`)
  if (body.when_where_how) sections.push(`## Implementation Intention\n${body.when_where_how}`)
  const mdBody = sections.length > 0 ? sections.join('\n\n') : undefined

  const result = await updateEntity<Goal>('goals', id, updates, mdBody)
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(result)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const deleted = await deleteEntity('goals', id)
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
