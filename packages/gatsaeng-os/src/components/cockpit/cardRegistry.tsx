'use client'

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  CARD REGISTRY — 카드 추가의 단일 진입점 (Single Source)     ║
 * ║                                                              ║
 * ║  새 카드 추가 방법:                                           ║
 * ║  1. 컴포넌트 파일 생성 (e.g. WeatherCard.tsx)                ║
 * ║  2. 아래 CARD_REGISTRY에 1줄 추가                            ║
 * ║  → 끝! 그리드 크기, 액센트, 라벨, 패널 전부 자동 반영        ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import type { ComponentType } from 'react'
import type { CockpitCard } from '@/stores/cockpitStore'
import { EveCard } from './EveCard'
import { ReportCard } from './ReportCard'
import { RoutineChecklist } from '@/components/dashboard/RoutineChecklist'
import { EnergyTracker } from '@/components/dashboard/EnergyTracker'
import { FocusTimer } from '@/components/dashboard/FocusTimer'
import { GoalRings } from '@/components/dashboard/GoalRings'
import { ZeigarnikPanel } from '@/components/dashboard/ZeigarnikPanel'
import { DdayWidget } from '@/components/dashboard/DdayWidget'
import { CustomCard } from './CustomCard'
import { LifeStatusCard } from './cards/LifeStatusCard'
import { NewsCard } from './cards/NewsCard'
import { CARD_COLORS } from './cardColors'

// ─── Card Definition ───

export interface CardDefinition {
  // Display
  label: string           // Nova-style uppercase label (e.g. "EVE STATUS")
  emoji: string           // Header emoji
  description: string     // AddCardPanel description (Korean)

  // Visual (Tailwind classes)
  accentColor: string     // Text color for header label
  borderColor: string     // Left border accent
  bgTint: string          // Subtle background tint

  // Grid defaults
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number

  // Component (React component or render function)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: ComponentType<any>
  /** Props to pass to the component (e.g. { category: 'invest' }) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  componentProps?: Record<string, any>
}

// ─── THE REGISTRY ───

export const CARD_REGISTRY = {
  life_status: {
    label: 'LIFE STATUS', emoji: '🔆', description: '6축 갓생 상태 한눈에',
    ...CARD_COLORS.emerald, w: 6, h: 3, minW: 4, minH: 2,
    component: LifeStatusCard,
  },
  eve: {
    label: 'EVE STATUS', emoji: '🍎', description: 'Pending + 오픈 루프',
    ...CARD_COLORS.purple, w: 4, h: 4, minW: 3, minH: 3,
    component: EveCard,
  },
  'report-invest': {
    label: 'INVEST REPORT', emoji: '📈', description: '최신 PDF 리포트',
    ...CARD_COLORS.emerald, w: 4, h: 3, minW: 3, minH: 2,
    component: ReportCard, componentProps: { category: 'invest' },
  },
  'report-beauty': {
    label: 'BEAUTY REPORT', emoji: '💄', description: '뷰티 전략 PDF',
    ...CARD_COLORS.pink, w: 4, h: 3, minW: 3, minH: 2,
    component: ReportCard, componentProps: { category: 'beauty' },
  },
  'report-saju': {
    label: 'SAJU REPORT', emoji: '🧭', description: '사주 분석 PDF',
    ...CARD_COLORS.amber, w: 4, h: 3, minW: 3, minH: 2,
    component: ReportCard, componentProps: { category: 'saju' },
  },
  routine: {
    label: 'ROUTINES', emoji: '✅', description: '오늘의 루틴 체크',
    ...CARD_COLORS.green, w: 3, h: 4, minW: 3, minH: 3,
    component: RoutineChecklist,
  },
  energy: {
    label: 'ENERGY', emoji: '⚡', description: '에너지 레벨 로그',
    ...CARD_COLORS.yellow, w: 3, h: 3, minW: 2, minH: 2,
    component: EnergyTracker,
  },
  goals: {
    label: 'GOALS', emoji: '🎯', description: '목표 진척 링',
    ...CARD_COLORS.red, w: 4, h: 4, minW: 3, minH: 3,
    component: GoalRings,
  },
  timer: {
    label: 'TIMER', emoji: '⏱', description: '포커스 타이머',
    ...CARD_COLORS.cyan, w: 3, h: 3, minW: 2, minH: 2,
    component: FocusTimer,
  },
  zeigarnik: {
    label: 'OPEN LOOPS', emoji: '🔁', description: '미완료 태스크',
    ...CARD_COLORS.orange, w: 4, h: 3, minW: 3, minH: 2,
    component: ZeigarnikPanel,
  },
  dday: {
    label: 'D-DAY', emoji: '📅', description: 'D-Day 카운터',
    ...CARD_COLORS.blue, w: 3, h: 3, minW: 2, minH: 2,
    component: DdayWidget,
  },
  note: {
    label: 'MEMO', emoji: '📝', description: '자유 메모 카드',
    ...CARD_COLORS.slate, w: 3, h: 3, minW: 2, minH: 2, maxW: 8, maxH: 8,
    component: CustomCard,
  },
  custom: {
    label: 'CUSTOM', emoji: '✨', description: '나만의 커스텀 카드',
    ...CARD_COLORS.violet, w: 3, h: 3, minW: 2, minH: 2, maxW: 12, maxH: 12,
    component: CustomCard,
  },
  news: {
    label: 'NEWS', emoji: '📰', description: '실시간 뉴스 피드',
    ...CARD_COLORS.cyan, w: 4, h: 4, minW: 3, minH: 3,
    component: NewsCard,
  },
} as const satisfies Record<string, CardDefinition>

// ─── Derived Types & Helpers ───

/** All registered card type keys */
export type CockpitCardType = keyof typeof CARD_REGISTRY

/** Get card definition (returns undefined for unknown types) */
export function getCardDef(type: string): CardDefinition | undefined {
  return (CARD_REGISTRY as Record<string, CardDefinition>)[type]
}

/** Get grid size defaults for a card type */
export function getCardGridSize(type: string) {
  const def = getCardDef(type)
  if (!def) return { w: 3, h: 3 }
  return { w: def.w, h: def.h, minW: def.minW, minH: def.minH, maxW: def.maxW, maxH: def.maxH }
}

/** All card types as array (for AddCardPanel) */
export function getAvailableCards() {
  return Object.entries(CARD_REGISTRY).map(([type, def]) => ({
    type: type as CockpitCardType,
    label: `${def.emoji} ${def.label}`,
    description: def.description,
  }))
}

// ─── Card Content Renderer ───

export function CardContent({ card }: { card: CockpitCard }) {
  const def = getCardDef(card.type)
  if (!def) return null

  const Component = def.component
  return <Component {...(def.componentProps ?? {})} card={card} />
}

