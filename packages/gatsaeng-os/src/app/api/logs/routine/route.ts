import { NextResponse } from 'next/server'
import { safeJson, serverError } from '@/lib/safeJson'
import { getEntityByDate, createDateEntity, updateDateEntity } from '@/lib/vault'
import { routineLogSchema } from '@/lib/vault/schemas'
import type { RoutineLog } from '@/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

  const result = await getEntityByDate<RoutineLog>('routineLogs', date, routineLogSchema)
  if (!result) return NextResponse.json({ date, completions: [] })
  return NextResponse.json(result.data)
}

export async function POST(request: Request) {
  const [body, _err] = await safeJson(request); if (_err) return _err
  const date = body.date || new Date().toISOString().split('T')[0]

  const existing = await getEntityByDate<RoutineLog>('routineLogs', date, routineLogSchema)

  if (existing) {
    const completions = [...existing.data.completions]
    const idx = completions.findIndex(c => c.routine_id === body.routine_id)

    if (body.undo && idx >= 0) {
      completions.splice(idx, 1)
    } else if (!body.undo && idx < 0) {
      completions.push({
        routine_id: body.routine_id,
        completed_at: new Date().toISOString(),
        mood: body.mood,
      })
    }

    const updated = await updateDateEntity<RoutineLog>('routineLogs', date, { date, completions })
    return NextResponse.json(updated)
  }

  if (body.undo) {
    return NextResponse.json({ date, completions: [] })
  }

  const log: RoutineLog = {
    date,
    completions: [{
      routine_id: body.routine_id,
      completed_at: new Date().toISOString(),
      mood: body.mood,
    }],
  }

  const created = await createDateEntity<RoutineLog>('routineLogs', date, log)
  return NextResponse.json(created, { status: 201 })
}
