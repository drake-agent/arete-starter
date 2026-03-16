import { NextResponse } from 'next/server'
import { getEntityByDate, createDateEntity, updateDateEntity } from '@/lib/vault'
import { dailyManifestSchema } from '@/lib/vault/schemas'
import type { DailyManifest } from '@/types'
import { format } from 'date-fns'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd')

  const item = await getEntityByDate<DailyManifest>('tasks', date, dailyManifestSchema)

  if (!item) {
    // return empty manifest for today
    const empty: DailyManifest = {
      date,
      gatsaeng_score: 0,
      routines_done: 0,
      routines_total: 0,
      focus_minutes: 0,
    }
    return NextResponse.json(empty)
  }

  return NextResponse.json(item.data)
}

export async function POST(req: Request) {
  const body = await req.json()
  const date = body.date || format(new Date(), 'yyyy-MM-dd')

  const existing = await getEntityByDate<DailyManifest>('tasks', date)

  if (existing) {
    // update
    const merged = { ...existing.data, ...body, date }
    const updated = await updateDateEntity<DailyManifest>('tasks', date, merged)
    return NextResponse.json(updated)
  }

  // create
  const data: DailyManifest = {
    date,
    gatsaeng_score: body.gatsaeng_score ?? 0,
    routines_done: body.routines_done ?? 0,
    routines_total: body.routines_total ?? 0,
    focus_minutes: body.focus_minutes ?? 0,
  }
  const created = await createDateEntity<DailyManifest>('tasks', date, data)
  return NextResponse.json(created, { status: 201 })
}
