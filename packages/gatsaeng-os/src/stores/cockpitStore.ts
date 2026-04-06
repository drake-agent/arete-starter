import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import { getCardGridSize, type CockpitCardType } from '@/components/cockpit/cardRegistry'
import { DEFAULT_LAYOUT } from '@/components/cockpit/gridConfig'

export type { CockpitCardType }

export interface CardMeta {
  emoji?: string
  label?: string
  accentColor?: string
  borderColor?: string
  bgTint?: string
}

export interface CockpitCard {
  id: string
  type: CockpitCardType
  x: number   // grid column (0-based)
  y: number   // grid row (0-based)
  w: number   // grid columns wide
  h: number   // grid rows tall
  title?: string
  content?: string
  meta?: CardMeta
}

// ─── Workspace ───

export interface Workspace {
  id: string
  name: string
  icon: string
  cards: CockpitCard[]
  createdAt: string
  /** Special workspace types get custom rendering */
  special?: 'focus' | 'calm'
}

interface CockpitState {
  workspaces: Workspace[]
  activeWorkspaceId: string

  // Workspace CRUD
  addWorkspace: (name: string, icon?: string) => void
  removeWorkspace: (id: string) => void
  updateWorkspace: (id: string, patch: Partial<Pick<Workspace, 'name' | 'icon'>>) => void
  setActiveWorkspace: (id: string) => void

  // Card CRUD (operates on active workspace)
  addCard: (type: CockpitCardType, init?: Partial<Pick<CockpitCard, 'title' | 'content' | 'meta'>>) => void
  removeCard: (id: string) => void
  updateCard: (id: string, patch: Partial<CockpitCard>) => void
  batchUpdateCards: (updates: Array<{ id: string; x: number; y: number; w: number; h: number }>) => void

  // Computed helpers
  activeWorkspace: () => Workspace | undefined
}

function createDefaultCards(): CockpitCard[] {
  return DEFAULT_LAYOUT.map(item => ({
    id: nanoid(),
    type: item.type,
    x: item.x,
    y: item.y,
    ...getCardGridSize(item.type),
  }))
}

function createDefaultWorkspaces(): Workspace[] {
  return [
    {
      id: 'ws-base',
      name: 'Base Camp',
      icon: '🏕️',
      cards: createDefaultCards(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ws-focus',
      name: 'Focus',
      icon: '🎯',
      cards: [],
      createdAt: new Date().toISOString(),
      special: 'focus',
    },
    {
      id: 'ws-calm',
      name: 'Calm Room',
      icon: '🌊',
      cards: [],
      createdAt: new Date().toISOString(),
      special: 'calm',
    },
  ]
}

// ─── Smart Grid Positioning ───

/**
 * Scan the grid to find the first available position where a card of size (w×h) fits.
 * Scans row-by-row, column-by-column (top-left → bottom-right).
 */
function findNextPosition(cards: CockpitCard[], newW: number, newH: number, cols: number = 12): { x: number; y: number } {
  if (cards.length === 0) return { x: 0, y: 0 }

  // Build a set of occupied cells
  const bottom = cards.reduce((max, c) => Math.max(max, c.y + c.h), 0)
  const occupied = new Set<string>()
  for (const card of cards) {
    for (let r = card.y; r < card.y + card.h; r++) {
      for (let c = card.x; c < Math.min(card.x + card.w, cols); c++) {
        occupied.add(`${r},${c}`)
      }
    }
  }

  // Scan for the first position where newW×newH fits without overlap
  const scanRows = bottom + newH
  for (let y = 0; y <= scanRows; y++) {
    for (let x = 0; x <= cols - newW; x++) {
      let fits = true
      for (let dy = 0; dy < newH && fits; dy++) {
        for (let dx = 0; dx < newW && fits; dx++) {
          if (occupied.has(`${y + dy},${x + dx}`)) fits = false
        }
      }
      if (fits) return { x, y }
    }
  }

  return { x: 0, y: bottom }
}

export const useCockpitStore = create<CockpitState>()(
  persist(
    (set, get) => ({
      workspaces: createDefaultWorkspaces(),
      activeWorkspaceId: 'ws-base',

      activeWorkspace: () => {
        const state = get()
        return state.workspaces.find(w => w.id === state.activeWorkspaceId)
      },

      // ── Workspace CRUD ──

      addWorkspace: (name, icon = '📌') =>
        set((s) => {
          const newWs: Workspace = {
            id: nanoid(),
            name,
            icon,
            cards: [],
            createdAt: new Date().toISOString(),
          }
          return {
            workspaces: [...s.workspaces, newWs],
            activeWorkspaceId: newWs.id,
          }
        }),

      removeWorkspace: (id) =>
        set((s) => {
          if (s.workspaces.length <= 1) return s // prevent deleting last workspace
          const filtered = s.workspaces.filter(w => w.id !== id)
          const activeId = s.activeWorkspaceId === id ? filtered[0].id : s.activeWorkspaceId
          return { workspaces: filtered, activeWorkspaceId: activeId }
        }),

      updateWorkspace: (id, patch) =>
        set((s) => ({
          workspaces: s.workspaces.map(w => w.id === id ? { ...w, ...patch } : w),
        })),

      setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),

      // ── Card CRUD (active workspace) ──

      addCard: (type, init) =>
        set((s) => {
          const ws = s.workspaces.find(w => w.id === s.activeWorkspaceId)
          const existingCards = ws?.cards ?? []
          const size = getCardGridSize(type)
          const pos = findNextPosition(existingCards, size.w, size.h)

          return {
            workspaces: s.workspaces.map(w =>
              w.id === s.activeWorkspaceId
                ? {
                    ...w,
                    cards: [
                      ...w.cards,
                      {
                        id: nanoid(),
                        type,
                        x: pos.x,
                        y: pos.y,
                        ...size,
                        ...init,
                      },
                    ],
                  }
                : w
            ),
          }
        }),

      removeCard: (id) =>
        set((s) => ({
          workspaces: s.workspaces.map(w =>
            w.id === s.activeWorkspaceId
              ? { ...w, cards: w.cards.filter(c => c.id !== id) }
              : w
          ),
        })),

      updateCard: (id, patch) =>
        set((s) => ({
          workspaces: s.workspaces.map(w =>
            w.id === s.activeWorkspaceId
              ? { ...w, cards: w.cards.map(c => c.id === id ? { ...c, ...patch } : c) }
              : w
          ),
        })),

      batchUpdateCards: (updates) =>
        set((s) => ({
          workspaces: s.workspaces.map(w =>
            w.id === s.activeWorkspaceId
              ? {
                  ...w,
                  cards: w.cards.map(c => {
                    const u = updates.find(u => u.id === c.id)
                    return u ? { ...c, x: u.x, y: u.y, w: u.w, h: u.h } : c
                  }),
                }
              : w
          ),
        })),
    }),
    {
      name: 'cockpit-store',
      version: 4,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>

        if (version < 2) {
          // v0/v1 → v2: Migrate pixel-based positions to grid units
          const ROW_HEIGHT = 80
          // Use a safe default for SSR — the exact value doesn't matter since
          // this migration only runs once during client-side rehydration
          const colWidth = 900 / 12
          const oldCards = (state.cards as CockpitCard[]) || []
          const cards = oldCards.map((card) => ({
            ...card,
            x: Math.min(11, Math.max(0, Math.round(card.x / colWidth))),
            y: Math.max(0, Math.round(card.y / ROW_HEIGHT)),
            w: getCardGridSize(card.type)?.w ?? 3,
            h: getCardGridSize(card.type)?.h ?? 3,
          }))
          state.cards = cards
        }

        if (version < 3) {
          // v2 → v3: Wrap cards+mode into workspaces
          const cards = (state.cards as CockpitCard[]) || createDefaultCards()
          const mode = (state.mode as string) || 'base'

          const workspaces: Workspace[] = [
            {
              id: 'ws-base',
              name: 'Base Camp',
              icon: '🏕️',
              cards,
              createdAt: new Date().toISOString(),
            },
            {
              id: 'ws-focus',
              name: 'Focus',
              icon: '🎯',
              cards: [],
              createdAt: new Date().toISOString(),
              special: 'focus',
            },
            {
              id: 'ws-calm',
              name: 'Calm Room',
              icon: '🌊',
              cards: [],
              createdAt: new Date().toISOString(),
              special: 'calm',
            },
          ]

          const activeWorkspaceId =
            mode === 'focus' ? 'ws-focus' :
            mode === 'calm' ? 'ws-calm' :
            'ws-base'

          // Clean up old fields
          delete state.cards
          delete state.mode

          return { ...state, workspaces, activeWorkspaceId }
        }

        if (version < 4) {
          // v3 → v4: Reset Base Camp cards to new ARETE 6-axis layout (fix overlap)
          const ws = (state.workspaces as Workspace[]) || []
          const updated = ws.map(w => {
            if (w.id === 'ws-base') {
              return { ...w, cards: createDefaultCards() }
            }
            return w
          })
          return { ...state, workspaces: updated }
        }

        return state
      },
    }
  )
)
