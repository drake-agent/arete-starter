import type { CockpitCardType } from './cardRegistry'

// ─── Grid Constants ───
export const GRID_COLS = { lg: 12, md: 8, sm: 4 }
export const GRID_BREAKPOINTS = { lg: 1200, md: 768, sm: 0 }
export const GRID_ROW_HEIGHT = 80
export const GRID_MARGIN: [number, number] = [12, 12]

// ─── Default Card Layout (Base Camp — ARETE Life Design OS) ───
// Eve 카드 메인 승격 + 6축 상태 카드 상단 배치
export const DEFAULT_LAYOUT: { type: CockpitCardType; x: number; y: number }[] = [
  // Row 0: Life Status (w=6,h=3)
  { type: 'life_status',     x: 0, y: 0 },
  // Row 0 right: Eve (w=4,h=4) — 같은 행 오른쪽
  { type: 'eve',             x: 6, y: 0 },
  // Row 1: y=4 (eve h=4이므로 max(3,4)=4)
  { type: 'report-invest',   x: 0, y: 4 },
  { type: 'report-beauty',   x: 4, y: 4 },
  { type: 'energy',          x: 8, y: 4 },
  // Row 2: y=7 (reports/energy h=3이므로 4+3=7)
  { type: 'routine',         x: 0, y: 7 },
  { type: 'goals',           x: 3, y: 7 },
  { type: 'zeigarnik',       x: 7, y: 7 },
]
