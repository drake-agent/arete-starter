'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFavoritesStore, type FavoriteType } from '@/stores/favoritesStore'

interface PinButtonProps {
  type: FavoriteType
  id: string
  title: string
  className?: string
  size?: number
}

export function PinButton({ type, id, title, className, size = 16 }: PinButtonProps) {
  const { toggle, isFavorite } = useFavoritesStore()
  const pinned = isFavorite(type, id)

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        toggle({ type, id, title })
      }}
      className={cn(
        'transition-colors',
        pinned
          ? 'text-gatsaeng-amber'
          : 'text-muted-foreground/40 hover:text-gatsaeng-amber/70',
        className
      )}
      title={pinned ? '즐겨찾기 해제' : '즐겨찾기'}
    >
      <Star
        style={{ width: size, height: size }}
        className={cn(pinned && 'fill-current')}
      />
    </button>
  )
}
