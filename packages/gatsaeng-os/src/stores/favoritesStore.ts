'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type FavoriteType = 'note' | 'task' | 'goal' | 'project' | 'book'

export interface FavoriteItem {
  type: FavoriteType
  id: string
  title: string
}

interface FavoritesStore {
  favorites: FavoriteItem[]
  add: (item: FavoriteItem) => void
  remove: (type: FavoriteType, id: string) => void
  toggle: (item: FavoriteItem) => void
  isFavorite: (type: FavoriteType, id: string) => boolean
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      add: (item) =>
        set((s) => {
          if (s.favorites.some((f) => f.type === item.type && f.id === item.id)) return s
          return { favorites: [...s.favorites, item] }
        }),
      remove: (type, id) =>
        set((s) => ({
          favorites: s.favorites.filter((f) => !(f.type === type && f.id === id)),
        })),
      toggle: (item) => {
        const exists = get().isFavorite(item.type, item.id)
        if (exists) {
          get().remove(item.type, item.id)
        } else {
          get().add(item)
        }
      },
      isFavorite: (type, id) => get().favorites.some((f) => f.type === type && f.id === id),
    }),
    { name: 'gatsaeng-favorites' }
  )
)
