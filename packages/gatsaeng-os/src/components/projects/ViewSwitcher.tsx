'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { LayoutGrid, Table, Calendar, List } from 'lucide-react'
import type { ViewType } from '@/types'

const VIEWS: { value: ViewType; icon: React.ReactNode; label: string }[] = [
  { value: 'kanban', icon: <LayoutGrid className="w-4 h-4" />, label: 'Kanban' },
  { value: 'table', icon: <Table className="w-4 h-4" />, label: 'Table' },
  { value: 'list', icon: <List className="w-4 h-4" />, label: 'List' },
  { value: 'calendar', icon: <Calendar className="w-4 h-4" />, label: 'Calendar' },
]

interface ViewSwitcherProps {
  value: ViewType
  onChange: (view: ViewType) => void
}

export function ViewSwitcher({ value, onChange }: ViewSwitcherProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as ViewType)}
      className="bg-secondary/50 p-0.5 rounded-md"
    >
      {VIEWS.map(view => (
        <ToggleGroupItem
          key={view.value}
          value={view.value}
          aria-label={view.label}
          className="px-2.5 py-1.5 text-xs gap-1.5 data-[state=on]:bg-card data-[state=on]:text-foreground"
        >
          {view.icon}
          <span className="hidden sm:inline">{view.label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
