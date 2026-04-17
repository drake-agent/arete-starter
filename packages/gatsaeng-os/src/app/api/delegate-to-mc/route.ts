import { NextResponse } from 'next/server'
import { safeJson } from '@/lib/safeJson'

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
    const [body, jsonErr] = await safeJson<{
      taskId?: string
      title?: string
      description?: string
      priority?: string
    }>(req)
    if (jsonErr) return jsonErr
    const { taskId, title, description, priority } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    const res = await fetch(MC_TASKS_URL, {
      method: 'POST',
      headers: mcHeaders(),
      body: JSON.stringify({
        title: title.trim(),
        description: description?.trim() ?? '',
        priority: (priority && PRIORITY_MAP[priority]) ?? 'medium',
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
    console.error('[delegate-to-mc]', err)
    return NextResponse.json({ error: 'MC delegate failed' }, { status: 502 })
  }
}
