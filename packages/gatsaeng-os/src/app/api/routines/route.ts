import { NextResponse } from 'next/server'
import { listEntities, createEntity } from '@/lib/vault'
import { routineSchema } from '@/lib/vault/schemas'
import type { Routine } from '@/types'

export async function GET() {
  const results = await listEntities<Routine>('routines', routineSchema)
  return NextResponse.json(results.map(r => r.data))
}

export async function POST(request: Request) {
  const body = await request.json()
  const now = new Date().toISOString()
  const data = {
    ...body,
    days_of_week: body.days_of_week ?? [1, 2, 3, 4, 5, 6, 7],
    trigger_type: body.trigger_type ?? 'time',
    energy_required: body.energy_required ?? 'medium',
    streak: 0,
    longest_streak: 0,
    is_active: true,
    position: body.position ?? 0,
    created_at: now,
  }

  const entity = await createEntity<Routine>('routines', data)
  return NextResponse.json(entity, { status: 201 })
}
