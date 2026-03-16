import type { ScoreEvent, ScoreResult } from '@/types'

const BASE_SCORES: Record<ScoreEvent['type'], number> = {
  routine_complete: 10,
  task_done: 5,
  task_done_urgent: 15,
  milestone_complete: 100,
  review_written: 20,
  data_uploaded: 10,
  goal_25pct: 30,
  goal_50pct: 60,
  goal_100pct: 200,
}

export function calculateScore(event: ScoreEvent): ScoreResult {
  const base = BASE_SCORES[event.type] ?? 0

  // streak multiplier (max 5x)
  const streak = event.streakCount ?? 0
  const multiplier = Math.min(1 + streak * 0.05, 5.0)
  let points = Math.round(base * multiplier)

  // 15% variable bonus (Skinner)
  let bonus_message: string | null = null
  if (Math.random() < 0.15) {
    const bonus = [5, 10, 15, 25][Math.floor(Math.random() * 4)]
    points += bonus
    bonus_message = `보너스 +${bonus}점!`
  }

  return { points, bonus_message }
}
