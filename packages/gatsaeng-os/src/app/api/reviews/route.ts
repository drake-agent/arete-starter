import { NextResponse } from 'next/server'
import { listEntities, createEntity } from '@/lib/vault'
import { reviewSchema } from '@/lib/vault/schemas'
import type { Review } from '@/types'

export async function GET() {
  const results = await listEntities<Review>('reviews', reviewSchema)
  return NextResponse.json(results.map(r => r.data))
}

export async function POST(request: Request) {
  const body = await request.json()
  const now = new Date().toISOString()
  const data = {
    ...body,
    created_at: now,
  }

  const sections: string[] = []
  if (body.accomplished) sections.push(`## 이번 주 가장 잘한 것\n${body.accomplished}`)
  if (body.struggled) sections.push(`## 어디서 막혔는가\n${body.struggled}`)
  if (body.learnings) sections.push(`## 배운 점\n${body.learnings}`)
  if (body.next_week_focus) sections.push(`## 다음 주 포커스\n${body.next_week_focus}`)
  if (body.energy_pattern) sections.push(`## 에너지 패턴\n${body.energy_pattern}`)
  if (body.habit_insight) sections.push(`## 루틴 인사이트\n${body.habit_insight}`)

  const entity = await createEntity<Review>('reviews', data, sections.join('\n\n'))
  return NextResponse.json(entity, { status: 201 })
}
