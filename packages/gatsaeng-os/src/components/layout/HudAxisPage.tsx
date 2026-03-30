'use client'

import { cn } from '@/lib/utils'

interface Props {
  title: string
  subtitle: string
  icon: React.ReactNode
  color: string
  score?: number
  children: React.ReactNode
}

export function HudAxisPage({ title, subtitle, icon, color, score, children }: Props) {
  const pct = score !== undefined ? Math.min(Math.max(score, 0), 100) : null
  const statusLabel =
    pct === null ? 'NO DATA' :
    pct >= 70 ? 'GOOD' :
    pct >= 40 ? 'NORMAL' : 'WARNING'
  const statusColor =
    pct === null ? '#94a3b8' :
    pct >= 70 ? '#10b981' :
    pct >= 40 ? '#f59e0b' : '#f43f5e'

  return (
    <div className="mx-auto max-w-full space-y-3 md:space-y-5 xl:max-w-5xl">
      <div
        className="hud-card hud-frame-corners overflow-hidden p-3 md:p-7"
        style={{
          borderColor: `${color}55`,
          boxShadow: `0 0 28px ${color}12`,
          background: `linear-gradient(180deg, ${color}0f 0%, rgba(17,24,39,0.98) 28%, rgba(10,14,26,0.98) 100%)`,
        }}
      >
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />

        <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-[120px_1fr_180px] lg:items-center">
          {pct !== null ? (
            <div
              className="relative mx-auto shrink-0 justify-self-start lg:mx-0"
              style={{
                width: 96,
                height: 96,
                borderRadius: '999px',
                background: `conic-gradient(${color} ${pct * 3.6}deg, #111827 ${pct * 3.6}deg)`,
                boxShadow: `0 0 24px ${color}20`,
              }}
            >
              <div className="absolute inset-2 flex flex-col items-center justify-center rounded-full border border-white/5" style={{ background: '#0f1726' }}>
                <span className="hud-mono text-xl font-bold leading-none md:text-2xl" style={{ color }}>{pct}</span>
                <span className="hud-label" style={{ fontSize: '8px' }}>/ 100</span>
              </div>
            </div>
          ) : (
            <div
              className="relative mx-auto flex shrink-0 items-center justify-center lg:mx-0"
              style={{ width: 96, height: 96, borderRadius: '999px', border: `1px solid ${color}55`, background: 'rgba(10,14,26,0.85)' }}
            >
              <span style={{ color, opacity: 0.6 }}>{icon}</span>
            </div>
          )}

          <div className="min-w-0 text-center lg:text-left">
            <div className="mb-2 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <span style={{ color }}>{icon}</span>
              <h1 className="hud-mono text-xl font-bold tracking-[0.14em] text-foreground md:text-2xl lg:text-3xl">{title}</h1>
              <span
                className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{ color: statusColor, background: `${statusColor}14`, border: `1px solid ${statusColor}44` }}
              >
                {statusLabel}
              </span>
            </div>
            <p className="mx-auto max-w-2xl text-xs text-muted-foreground sm:text-sm md:text-base lg:mx-0">{subtitle}</p>
          </div>

          <div className="grid grid-cols-3 gap-1.5 lg:min-w-[160px] lg:justify-self-end lg:gap-2">
            {[
              { label: 'PRIMARY', value: pct ?? 0 },
              { label: 'TREND', value: pct !== null ? Math.max(0, pct - 6) : 0 },
              { label: 'SYNC', value: pct !== null ? Math.min(100, pct + 4) : 0 },
            ].map(metric => (
              <div key={metric.label} className="space-y-1 lg:flex lg:items-center lg:gap-2 lg:space-y-0">
                <span className="hud-label block truncate text-center text-[8px] lg:w-14 lg:text-left lg:text-[9px]">{metric.label}</span>
                <div className="h-1.5 overflow-hidden border border-white/5 bg-[#0f1726] lg:flex-1">
                  <div className="h-full" style={{ width: `${metric.value}%`, background: color }} />
                </div>
                <span className="hud-mono block text-center text-[9px] lg:text-left lg:text-[10px]" style={{ color }}>{metric.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {children}
    </div>
  )
}

export function HudCard({
  children,
  className,
  color,
  title,
  icon,
  topRight,
}: {
  children: React.ReactNode
  className?: string
  color?: string
  title?: string
  icon?: React.ReactNode
  topRight?: React.ReactNode
}) {
  return (
    <div
      className={cn('hud-card hud-frame-corners overflow-hidden p-4 md:p-5 transition-all duration-200', className)}
      style={color ? { borderColor: `${color}40`, boxShadow: `0 0 18px ${color}10` } : undefined}
    >
      {(title || topRight) && (
        <div className="hud-panel-labelbar">
          <div className="flex min-w-0 items-center gap-2">
            {icon && <span style={{ color: color ?? '#60a5fa' }}>{icon}</span>}
            {title && (
              <span className="hud-label text-foreground" style={{ color: '#dbe6f5', fontSize: '10px' }}>
                {title}
              </span>
            )}
          </div>
          {topRight && <div className="hud-mono text-[10px] text-muted-foreground md:text-xs">{topRight}</div>}
        </div>
      )}
      {children}
    </div>
  )
}

export function HudDataPending({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-3">
      <div className="hud-blink h-1.5 w-1.5 rounded-full" style={{ background: '#60a5fa' }} />
      <span className="hud-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground md:text-xs">
        {label ?? 'DATA LINK PENDING...'}
      </span>
    </div>
  )
}
