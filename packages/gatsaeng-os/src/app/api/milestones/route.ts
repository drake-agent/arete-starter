import { NextResponse } from 'next/server'
import { safeJson, serverError } from '@/lib/safeJson'
import { listEntities, createEntity } from '@/lib/vault'
import { milestoneSchema } from '@/lib/vault/schemas'
import type { Milestone } from '@/types'
import { LIMITS } from '@/types'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const goalId = searchParams.get('goal_id')

  const items = await listEntities<Milestone>('milestones', milestoneSchema)
  let data = items.map(i => i.data)

  if (goalId) {
    data = data.filter(m => m.goal_id === goalId)
  }

  // sort by due_date
  data.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const [body, _err] = await safeJson(req); if (_err) return _err

  // constraint: max 4 milestones per goal
  if (body.goal_id) {
    const existing = await listEntities<Milestone>('milestones', milestoneSchema)
    const goalMilestones = existing.filter(m => m.data.goal_id === body.goal_id && m.data.status === 'active')
    if (goalMilestones.length >= LIMITS.MAX_MILESTONES_PER_GOAL) {
      return NextResponse.json(
        { error: `목표당 마일스톤은 최대 ${LIMITS.MAX_MILESTONES_PER_GOAL}개입니다.` },
        { status: 400 }
      )
    }
  }

  const now = new Date().toISOString()
  const data = await createEntity<Milestone>('milestones', {
    ...body,
    current_value: body.current_value ?? 0,
    status: 'active',
    created_by: body.created_by || 'user',
    created: now,
  }, body.body_content)
  return NextResponse.json(data, { status: 201 })
}
