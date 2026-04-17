import { NextResponse } from 'next/server'
import { safeJson, serverError } from '@/lib/safeJson'
import { listEntities, createEntity } from '@/lib/vault'
import { goalSchema } from '@/lib/vault/schemas'
import type { Goal } from '@/types'

export async function GET() {
  const results = await listEntities<Goal>('goals', goalSchema)
  return NextResponse.json(results.map(r => ({ ...r.data, _content: r.content })))
}

export async function POST(request: Request) {
  const [body, _err] = await safeJson(request); if (_err) return _err
  const now = new Date().toISOString()
  const data = {
    ...body,
    current_value: body.current_value ?? 0,
    color: body.color ?? '#f5a623',
    status: body.status ?? 'active',
    created_at: now,
    updated_at: now,
  }

  const sections: string[] = []
  if (body.why_statement) sections.push(`## Why Statement\n${body.why_statement}`)
  if (body.identity_statement) sections.push(`## Identity Statement\n${body.identity_statement}`)
  if (body.when_where_how) sections.push(`## Implementation Intention\n${body.when_where_how}`)

  const entity = await createEntity<Goal>('goals', data, sections.join('\n\n'))
  return NextResponse.json(entity, { status: 201 })
}
