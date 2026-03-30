'use client'

import { memo, useMemo, useCallback } from 'react'
import { ResponsiveGridLayout, useContainerWidth, type LayoutItem, type Layout } from 'react-grid-layout'
import { X, GripHorizontal } from 'lucide-react'
import { useCockpitStore, type CockpitCard } from '@/stores/cockpitStore'
import { GRID_COLS, GRID_BREAKPOINTS, GRID_ROW_HEIGHT, GRID_MARGIN } from './gridConfig'
import { CardContent, getCardDef, type CardDefinition } from './cardRegistry'

// ─── Memoized individual card — only re-renders when its own data changes ───

interface CardWrapperProps {
  card: CockpitCard
  def: CardDefinition
  onRemove: (id: string) => void
}

const CardWrapper = memo(function CardWrapper({ card, def, onRemove }: CardWrapperProps) {
  const meta = card.meta
  const borderColor = meta?.borderColor || def.borderColor
  const bgTint = meta?.bgTint || def.bgTint
  const accentColor = meta?.accentColor || def.accentColor
  const emoji = meta?.emoji || def.emoji
  const label = meta?.label || card.title?.toUpperCase() || def.label

  return (
    <div className={`group rounded-sm border border-border bg-card shadow-none overflow-hidden flex flex-col border-l-2 ${borderColor} ${bgTint}`}>
      {/* Nova-style drag handle header */}
      <div className="card-drag-handle flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30 cursor-grab active:cursor-grabbing select-none shrink-0">
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-3 h-3 text-muted-foreground/50" />
          <span className="text-sm">{emoji}</span>
          <span className={`font-mono text-[10px] font-semibold tracking-wider ${accentColor}`}>
            {label}
          </span>
        </div>
        <button
          aria-label="카드 삭제"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onRemove(card.id) }}
          className="p-1 rounded hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Card content */}
      <div className="flex-1 overflow-auto">
        <CardContent card={card} />
      </div>
    </div>
  )
})

// ─── Stable config objects (created once, never changes identity) ───

const DRAG_CONFIG = { enabled: true, handle: '.card-drag-handle', bounded: false, threshold: 3 } as const
const RESIZE_CONFIG = { enabled: true, handles: ['se'] as const }

// ─── Grid Canvas ───

export function GridCanvas() {
  const cards = useCockpitStore(s => s.workspaces.find(w => w.id === s.activeWorkspaceId)?.cards ?? [])
  const removeCard = useCockpitStore(s => s.removeCard)
  const { width, mounted, containerRef } = useContainerWidth({ measureBeforeMount: true })

  const layout = useMemo<LayoutItem[]>(() =>
    cards.map(card => {
      const def = getCardDef(card.type)
      return {
        i: card.id,
        x: card.x,
        y: card.y,
        w: card.w,
        h: card.h,
        minW: def?.minW,
        minH: def?.minH,
        maxW: def?.maxW,
        maxH: def?.maxH,
      }
    }),
    [cards]
  )

  // Stable layouts object — only changes when layout array changes
  const layouts = useMemo(() => ({ lg: layout, md: layout, sm: layout }), [layout])

  const onLayoutChange = useCallback((newLayout: Layout) => {
    const { workspaces: ws, activeWorkspaceId: aid, batchUpdateCards } = useCockpitStore.getState()
    const workspace = ws.find(w => w.id === aid)
    if (!workspace) return

    const updates = newLayout
      .filter(item => {
        const card = workspace.cards.find(c => c.id === item.i)
        return card && (card.x !== item.x || card.y !== item.y || card.w !== item.w || card.h !== item.h)
      })
      .map(item => ({ id: item.i, x: item.x, y: item.y, w: item.w, h: item.h }))

    if (updates.length > 0) batchUpdateCards(updates)
  }, [])

  return (
    <div ref={containerRef}>
      {mounted && (
        <ResponsiveGridLayout
          className="layout"
          width={width}
          layouts={layouts}
          breakpoints={GRID_BREAKPOINTS}
          cols={GRID_COLS}
          rowHeight={GRID_ROW_HEIGHT}
          margin={GRID_MARGIN}
          dragConfig={DRAG_CONFIG}
          resizeConfig={RESIZE_CONFIG}
          onLayoutChange={onLayoutChange}
        >
          {cards.map(card => {
            const def = getCardDef(card.type)
            if (!def) return <div key={card.id} />
            return (
              <div key={card.id}>
                <CardWrapper card={card} def={def} onRemove={removeCard} />
              </div>
            )
          })}
        </ResponsiveGridLayout>
      )}
    </div>
  )
}
