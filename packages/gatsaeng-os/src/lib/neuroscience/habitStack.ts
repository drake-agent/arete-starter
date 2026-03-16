import type { Routine } from '@/types'

export function buildHabitChain<T extends Routine>(routines: T[]): T[][] {
  const anchors = routines.filter(r => !r.after_routine_id)
  const chains: T[][] = []

  for (const anchor of anchors) {
    const chain: T[] = [anchor]
    let current = anchor

    while (true) {
      const next = routines.find(r => r.after_routine_id === current.id)
      if (!next) break
      chain.push(next)
      current = next
    }

    chains.push(chain)
  }

  return chains
}
