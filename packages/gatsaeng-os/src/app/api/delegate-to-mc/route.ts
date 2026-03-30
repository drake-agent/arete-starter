import { NextResponse } from 'next/server'

const MC_TASKS_URL = process.env.MC_TASKS_URL ?? 'http://localhost:3005/api/tasks'
const MC_API_KEY = process.env.MC_API_KEY ?? ''

const PRIORITY_MAP: Record<string, string> = {
  urgent: 'high',
  high: 'high',
  medium: 'medium',
  low: 'low',
}

function mcHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (MC_API_KEY) h['x-api-key'] = MC_API_KEY
  return h
}

export async function POST(req: Request) {
  try {
    const { taskId, title, description, priority } = await req.json()

    if (!title?.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    const res = await fetch(MC_TASKS_URL, {
      method: 'POST',
      headers: mcHeaders(),
      body: JSON.stringify({
        title: title.trim(),
        description: description?.trim() ?? '',
        priority: PRIORITY_MAP[priority] ?? 'medium',
        status: 'inbox',
        metadata: { source: 'gatsaeng-os', gatsaeng_task_id: taskId ?? null },
      }),
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `MC API error (${res.status})` },
        { status: res.status >= 500 ? 502 : res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
