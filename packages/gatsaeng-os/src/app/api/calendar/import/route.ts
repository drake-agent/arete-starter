import { NextResponse } from 'next/server'
import { createEntity, listEntities, deleteEntity } from '@/lib/vault'
import { calendarEventSchema } from '@/lib/vault/schemas'
import type { CalendarEvent } from '@/types'

/**
 * POST /api/calendar/import
 * Bulk import calendar events (e.g., from Telegram weekly schedule).
 *
 * Body:
 * {
 *   events: CalendarEvent[],       // array of events to create
 *   clear_week?: boolean,          // if true, delete existing events in the date range first
 *   week_start?: string,           // YYYY-MM-DD, required if clear_week is true
 *   week_end?: string,             // YYYY-MM-DD, required if clear_week is true
 *   created_by?: string            // defaults to 'telegram'
 * }
 */
export async function POST(request: Request) {
  const body = await request.json()
  const { events, clear_week, week_start, week_end, created_by = 'telegram' } = body

  if (!events || !Array.isArray(events) || events.length === 0) {
    return NextResponse.json({ error: 'events array is required' }, { status: 400 })
  }

  // Optionally clear existing events in the week range
  if (clear_week && week_start && week_end) {
    const existing = await listEntities<CalendarEvent>('calendar', calendarEventSchema)
    const toDelete = existing
      .map(e => e.data)
      .filter(e => e.date >= week_start && e.date <= week_end && e.created_by === 'telegram')

    for (const event of toDelete) {
      await deleteEntity('calendar', event.id)
    }
  }

  // Create new events
  const created = []
  for (const event of events) {
    const data = {
      ...event,
      created_by: event.created_by || created_by,
      created_at: event.created_at || new Date().toISOString(),
    }
    const result = await createEntity<CalendarEvent>('calendar', data)
    created.push(result)
  }

  return NextResponse.json({ imported: created.length, events: created }, { status: 201 })
}
