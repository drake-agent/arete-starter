import { NextResponse } from 'next/server'
import { listEntities, createEntity } from '@/lib/vault'
import { bookSchema } from '@/lib/vault/schemas'
import type { Book } from '@/types'

export async function GET() {
  const books = await listEntities<Book>('books', bookSchema)
  return NextResponse.json(books.map(b => ({ ...b.data, _content: b.content ?? '' })))
}

export async function POST(request: Request) {
  const body = await request.json()
  const data = {
    ...body,
    status: body.status || 'want_to_read',
    created_at: new Date().toISOString(),
  }
  const result = await createEntity<Book>('books', data)
  return NextResponse.json(result, { status: 201 })
}
