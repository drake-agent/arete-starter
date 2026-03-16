import { NextResponse } from 'next/server'
import { listEntities, createEntity } from '@/lib/vault'
import { areaSchema } from '@/lib/vault/schemas'
import type { Area } from '@/types'
import { LIMITS } from '@/types'

export async function GET() {
  const items = await listEntities<Area>('areas', areaSchema)
  return NextResponse.json(items.map(i => i.data))
}

export async function POST(req: Request) {
  const body = await req.json()
  const now = new Date().toISOString()
  const data = await createEntity<Area>('areas', {
    ...body,
    status: 'active',
    linked_goals: body.linked_goals || [],
    created: now,
  }, body.body_content)
  return NextResponse.json(data, { status: 201 })
}
