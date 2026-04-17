import { NextResponse } from 'next/server'
import { safeJson, serverError } from '@/lib/safeJson'
import { listEntities, createEntity } from '@/lib/vault'
import { areaSchema } from '@/lib/vault/schemas'
import type { Area } from '@/types'
import { LIMITS } from '@/types'

export async function GET() {
  const items = await listEntities<Area>('areas', areaSchema)
  return NextResponse.json(items.map(i => i.data))
}

export async function POST(req: Request) {
  const [body, _err] = await safeJson(req); if (_err) return _err
  const now = new Date().toISOString()
  const data = await createEntity<Area>('areas', {
    ...body,
    status: 'active',
    linked_goals: body.linked_goals || [],
    created: now,
  }, body.body_content)
  return NextResponse.json(data, { status: 201 })
}
