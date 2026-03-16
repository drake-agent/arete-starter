'use client'

import { create } from 'zustand'
import type { SessionType } from '@/types'

const DURATIONS: Record<SessionType, number> = {
  pomodoro_25: 25 * 60,
  focus_90: 90 * 60,
  deep_work: 50 * 60,
}

interface TimerState {
  seconds: number
  isRunning: boolean
  sessionType: SessionType
  completedSessions: number
  energyLevelAtStart: number | null
  customMinutes: number
  startedAt: string | null
  start: () => void
  pause: () => void
  reset: () => void
  tick: () => void
  setSessionType: (type: SessionType) => void
  setCustomMinutes: (minutes: number) => void
  setEnergyLevel: (level: number) => void
}

export const useTimerStore = create<TimerState>((set, get) => ({
  seconds: DURATIONS.pomodoro_25,
  isRunning: false,
  sessionType: 'pomodoro_25',
  completedSessions: 0,
  energyLevelAtStart: null,
  customMinutes: 50,
  startedAt: null,
  start: () => {
    const { startedAt } = get()
    set({ isRunning: true, startedAt: startedAt ?? new Date().toISOString() })
  },
  pause: () => set({ isRunning: false }),
  reset: () => {
    const { sessionType, customMinutes } = get()
    const secs = sessionType === 'deep_work' ? customMinutes * 60 : DURATIONS[sessionType]
    set({ seconds: secs, isRunning: false, startedAt: null })
  },
  tick: () => {
    const { seconds, completedSessions } = get()
    if (seconds <= 1) {
      set({ isRunning: false, seconds: 0, completedSessions: completedSessions + 1 })
    } else {
      set({ seconds: seconds - 1 })
    }
  },
  setSessionType: (type) => {
    const { customMinutes } = get()
    const secs = type === 'deep_work' ? customMinutes * 60 : DURATIONS[type]
    set({ sessionType: type, seconds: secs, isRunning: false })
  },
  setCustomMinutes: (minutes) => {
    const clamped = Math.max(1, Math.min(180, minutes))
    set({ customMinutes: clamped, seconds: clamped * 60, isRunning: false })
  },
  setEnergyLevel: (level) => set({ energyLevelAtStart: level }),
}))
