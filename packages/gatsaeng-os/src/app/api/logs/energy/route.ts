import { NextResponse } from 'next/server'
import { getEntityByDate, createDateEntity, updateDateEntity } from '@/lib/vault'
import { energyLogSchema } from '@/lib/vault/schemas'
import type { EnergyLog } from '@/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

  const result = await getEntityByDate<EnergyLog>('energyLogs', date, energyLogSchema)
  if (!result) return NextResponse.json({ date, entries: [] })
  return NextResponse.json(result.data)
}

export async function POST(request: Request) {
  const body = await request.json()
  const date = body.date || new Date().toISOString().split('T')[0]

  const existing = await getEntityByDate<EnergyLog>('energyLogs', date, energyLogSchema)

  const entry = { hour: body.hour, level: body.level, note: body.note }

  if (existing) {
    const entries = [...existing.data.entries]
    const idx = entries.findIndex(e => e.hour === body.hour)
    if (idx >= 0) {
      entries[idx] = entry
    } else {
      entries.push(entry)
    }
    entries.sort((a, b) => a.hour - b.hour)

    const updated = await updateDateEntity<EnergyLog>('energyLogs', date, { date, entries })
    return NextResponse.json(updated)
  }

  const log: EnergyLog = { date, entries: [entry] }
  const created = await createDateEntity<EnergyLog>('energyLogs', date, log)
  return NextResponse.json(created, { status: 201 })
}
