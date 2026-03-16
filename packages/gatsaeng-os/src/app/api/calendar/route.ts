import { NextRequest, NextResponse } from 'next/server'
import { listEntities, createEntity } from '@/lib/vault'
import { calendarEventSchema } from '@/lib/vault/schemas'
import type { CalendarEvent } from '@/types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const weekStart = searchParams.get('week_start')
  const weekEnd = searchParams.get('week_end')
  const date = searchParams.get('date')

  const events = await listEntities<CalendarEvent>('calendar', calendarEventSchema)
  let filtered = events.map(e => e.data)

  if (date) {
    filtered = filtered.filter(e => e.date === date)
  } else if (weekStart && weekEnd) {
    filtered = filtered.filter(e => e.date >= weekStart && e.date <= weekEnd)
  }

  filtered.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return (a.time_start ?? '00:00').localeCompare(b.time_start ?? '00:00')
  })

  return NextResponse.json(filtered)
}

export async function POST(request: Request) {
  const body = await request.json()
  const data = {
    ...body,
    created_at: body.created_at || new Date().toISOString(),
  }
  const result = await createEntity<CalendarEvent>('calendar', data)
  return NextResponse.json(result, { status: 201 })
}
