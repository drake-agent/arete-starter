import { NextResponse } from 'next/server'
import { listEntities, createEntity } from '@/lib/vault'
import { focusSessionSchema } from '@/lib/vault/schemas'
import type { FocusSession } from '@/types'

export async function GET() {
  const results = await listEntities<FocusSession>('focusSessions', focusSessionSchema)
  return NextResponse.json(results.map(r => r.data))
}

export async function POST(request: Request) {
  const body = await request.json()
  const data = {
    ...body,
    session_type: body.session_type ?? 'pomodoro_25',
    completed: body.completed ?? false,
    started_at: body.started_at ?? new Date().toISOString(),
  }

  const entity = await createEntity<FocusSession>('focusSessions', data)
  return NextResponse.json(entity, { status: 201 })
}
