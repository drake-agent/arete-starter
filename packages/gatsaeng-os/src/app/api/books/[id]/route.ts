import { NextResponse } from 'next/server'
import { getEntity, updateEntity, deleteEntity } from '@/lib/vault'
import type { Book } from '@/types'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getEntity<Book>('books', id)
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ...result.data, _content: result.content ?? '' })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { content: bodyContent, ...updates } = body
  const finalUpdates = { ...updates, updated_at: new Date().toISOString() }
  const result = await updateEntity<Book>('books', id, finalUpdates, bodyContent)
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(result)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const deleted = await deleteEntity('books', id)
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
