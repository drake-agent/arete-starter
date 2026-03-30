import { NextResponse } from 'next/server'
import { listEntities, getEntityByDate } from '@/lib/vault'
import { taskSchema, bookSchema, energyLogSchema, routineSchema } from '@/lib/vault/schemas'
import type { Task, Book, EnergyLog, Routine } from '@/types'

export type AxisStatus = 'good' | 'normal' | 'warning'

export interface LifeAxis {
  id: string
  emoji: string
  label: string
  status: AxisStatus
  summary: string
}

export interface LifeStatusResponse {
  axes: LifeAxis[]
  updatedAt: string
}

export async function GET() {
  const today = new Date().toISOString().split('T')[0]

  // ── Energy ──────────────────────────────────────────────────
  let energyStatus: AxisStatus = 'normal'
  let energySummary = 'DATA LINK PENDING...'

  try {
    const energyResult = await getEntityByDate<EnergyLog>('energyLogs', today, energyLogSchema)
    if (energyResult && energyResult.data.entries.length > 0) {
      const entries = energyResult.data.entries
      const avg = entries.reduce((sum, e) => sum + e.level, 0) / entries.length
      const avgRounded = Math.round(avg * 10) / 10
      energySummary = `평균 에너지 ${avgRounded}/5`
      energyStatus = avg >= 3.5 ? 'good' : avg >= 2.5 ? 'normal' : 'warning'
    }
  } catch {
    // no data
  }

  // ── Work ────────────────────────────────────────────────────
  let workStatus: AxisStatus = 'normal'
  let workSummary = 'DATA LINK PENDING...'

  try {
    const [taskResults, routineResults] = await Promise.all([
      listEntities<Task>('tasks', taskSchema),
      listEntities<Routine>('routines', routineSchema),
    ])
    const todoTasks = taskResults.filter(r => r.data.status === 'todo')
    const count = todoTasks.length
    const routineCount = routineResults.length

    if (count === 0 && routineCount <= 1) {
      // 데이터가 없는 것으로 판단
      workStatus = 'normal'
      workSummary = 'DATA LINK PENDING...'
    } else {
      workSummary = count === 0 ? 'AWAITING INPUT' : `할일 ${count}개`
      if (count >= 6) {
        workStatus = 'warning'
        workSummary = `할일 ${count}개 (과부하)`
      } else if (count >= 3) {
        workStatus = 'normal'
      } else {
        workStatus = 'good'
      }
    }
  } catch {
    workStatus = 'normal'
    workSummary = 'DATA LINK PENDING...'
  }

  // ── Lifestyle ───────────────────────────────────────────────
  let lifestyleStatus: AxisStatus = 'normal'
  let lifestyleSummary = 'DATA LINK PENDING...'

  try {
    const bookResults = await listEntities<Book>('books', bookSchema)
    const reading = bookResults.filter(r => r.data.status === 'reading')
    if (reading.length > 0) {
      lifestyleStatus = 'good'
      lifestyleSummary = `${reading[0].data.title ?? '독서 중'} 읽는 중`
    }
  } catch {
    // no data
  }

  const axes: LifeAxis[] = [
    {
      id: 'energy',
      emoji: '⚡',
      label: 'Energy',
      status: energyStatus,
      summary: energySummary,
    },
    {
      id: 'work',
      emoji: '💼',
      label: 'Work',
      status: workStatus,
      summary: workSummary,
    },
    {
      id: 'relationship',
      emoji: '🤝',
      label: 'Relationship',
      status: 'normal',
      summary: 'AWAITING INPUT',
    },
    {
      id: 'finance',
      emoji: '💰',
      label: 'Finance',
      status: 'normal',
      summary: 'AWAITING INPUT',
    },
    {
      id: 'meaning',
      emoji: '🌟',
      label: 'Meaning',
      status: 'good',
      summary: '양호',
    },
    {
      id: 'lifestyle',
      emoji: '🌿',
      label: 'Lifestyle',
      status: lifestyleStatus,
      summary: lifestyleSummary,
    },
  ]

  return NextResponse.json({
    axes,
    updatedAt: new Date().toISOString(),
  } satisfies LifeStatusResponse)
}
