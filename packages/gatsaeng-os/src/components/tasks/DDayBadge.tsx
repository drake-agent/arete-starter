import { cn } from '@/lib/utils'

interface DDayBadgeProps {
  dueDate: string
  className?: string
}

export function DDayBadge({ dueDate, className }: DDayBadgeProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  const label = diff === 0 ? 'D-Day' : diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`

  const color = diff < 0
    ? 'bg-gatsaeng-red/20 text-gatsaeng-red border-gatsaeng-red/30'
    : diff <= 3
    ? 'bg-gatsaeng-red/10 text-gatsaeng-red border-gatsaeng-red/20'
    : diff <= 7
    ? 'bg-gatsaeng-amber/10 text-gatsaeng-amber border-gatsaeng-amber/20'
    : 'bg-muted text-muted-foreground border-border'

  return (
    <span className={cn(
      'inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
      color,
      className
    )}>
      {label}
    </span>
  )
}
