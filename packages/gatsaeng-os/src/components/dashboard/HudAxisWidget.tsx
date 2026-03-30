'use client'

import Link from 'next/link'
import type { RadarAxis } from './HexRadarChart'

interface Props {
  axis: RadarAxis
  href: string
  icon: React.ReactNode
  onHover?: (axisId: string | null) => void
}

const STATUS_LABEL = {
  good: { text: 'GOOD', cls: 'text-emerald-400' },
  normal: { text: 'NORM', cls: 'text-amber-400' },
  warning: { text: 'WARN', cls: 'text-rose-400' },
}

export function HudAxisWidget({ axis, href, icon, onHover }: Props) {
  const st = STATUS_LABEL[axis.status]
  const dotClass =
    axis.status === 'good' ? 'status-dot-good' :
    axis.status === 'warning' ? 'status-dot-warning' :
    'status-dot-normal'
  const pct = Math.min(Math.max(axis.value, 0), 100)

  return (
    <Link
      href={href}
      onMouseEnter={() => onHover?.(axis.id)}
      onMouseLeave={() => onHover?.(null)}
      className="hud-card hud-frame-corners group block p-3 transition-all duration-200 overflow-hidden"
      style={{ borderColor: `${axis.color}40`, boxShadow: `0 0 14px ${axis.color}10` }}
    >
      <div className="hud-panel-labelbar !mb-3" style={{ background: `linear-gradient(90deg, ${axis.color}12, rgba(255,255,255,0.02))` }}>
        <div className="flex items-center gap-2 min-w-0">
          <span style={{ color: axis.color }} className="opacity-95">{icon}</span>
          <span className="hud-label" style={{ color: axis.color, fontSize: '10px' }}>{axis.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${dotClass} shrink-0`} />
          <span className={`hud-label ${st.cls}`} style={{ fontSize: '9px' }}>{st.text}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-hidden">
        <div
          className="relative shrink-0"
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: `conic-gradient(${axis.color} ${pct * 3.6}deg, #111827 ${pct * 3.6}deg)`,
            boxShadow: `0 0 10px ${axis.color}20`,
          }}
        >
          <div className="absolute inset-1 rounded-full flex items-center justify-center border border-white/5" style={{ background: '#121826' }}>
            <span className="hud-mono text-[9px] font-bold leading-none" style={{ color: axis.color }}>
              {pct}
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="text-[8px] text-muted-foreground hud-mono tracking-[0.1em] uppercase mb-0.5 truncate">Summary</div>
          <div className="text-[10px] text-muted-foreground truncate leading-snug" title={axis.summary}>
            {axis.summary}
          </div>
        </div>
      </div>
    </Link>
  )
}
