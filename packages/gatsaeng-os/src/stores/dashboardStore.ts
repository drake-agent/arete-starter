'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WidgetId } from '@/types'

interface DashboardStore {
  activeWidgets: WidgetId[]
  toggleWidget: (id: WidgetId) => void
  reorderWidgets: (newOrder: WidgetId[]) => void
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      activeWidgets: ['proactive', 'routine', 'goals', 'dday', 'zeigarnik', 'timer', 'energy'],
      toggleWidget: (id) => set((s) => ({
        activeWidgets: s.activeWidgets.includes(id)
          ? s.activeWidgets.filter(w => w !== id)
          : [...s.activeWidgets, id],
      })),
      reorderWidgets: (newOrder) => set({ activeWidgets: newOrder }),
    }),
    { name: 'gatsaeng-dashboard-layout' }
  )
)
