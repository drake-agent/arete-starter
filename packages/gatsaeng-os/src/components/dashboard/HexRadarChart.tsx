'use client'

import { useMemo, useState } from 'react'

export interface RadarAxis {
  id: string
  label: string
  value: number
  color: string
  status: 'good' | 'normal' | 'warning'
  summary: string
}

interface Props {
  axes: RadarAxis[]
  size?: number
  hoveredAxisId?: string | null
  onHoverAxis?: (axisId: string | null) => void
  timestamp?: string
}

function polarToCartesian(cx: number, cy: number, r: number, angleRad: number) {
  return {
    x: cx + r * Math.sin(angleRad),
    y: cy - r * Math.cos(angleRad),
  }
}

function getSystemState(axes: RadarAxis[]) {
  const avg = axes.reduce((sum, axis) => sum + axis.value, 0) / Math.max(axes.length, 1)
  if (avg >= 66) return { label: 'ASCEND', sub: 'SYSTEM GAINING ALTITUDE', color: '#10b981' }
  if (avg >= 45) return { label: 'STABLE', sub: 'MISSION TRACKING NOMINAL', color: '#60a5fa' }
  return { label: 'CAUTION', sub: 'REALIGN CORE SIGNALS', color: '#f59e0b' }
}

// Mobile-friendly short labels for radar chart axes
const MOBILE_LABELS: Record<string, string> = {
  energy: 'ENR',
  work: 'WRK',
  relationship: 'REL',
  finance: 'FIN',
  meaning: 'MEAN',
  lifestyle: 'LIFE',
}

export function HexRadarChart({ axes, size = 420, hoveredAxisId, onHoverAxis, timestamp }: Props) {
  const [internalHovered, setInternalHovered] = useState<string | null>(null)
  const hovered = hoveredAxisId ?? internalHovered
  const isMobile = size <= 336
  const n = axes.length
  const cx = size / 2
  const cy = size / 2
  const maxR = size * 0.34
  const levels = [0.2, 0.4, 0.6, 0.8, 1]
  const systemState = useMemo(() => getSystemState(axes), [axes])

  function levelPoints(fraction: number) {
    return axes.map((_, i) => {
      const angle = (2 * Math.PI * i) / n
      const p = polarToCartesian(cx, cy, maxR * fraction, angle)
      return `${p.x},${p.y}`
    }).join(' ')
  }

  const dataPoints = axes.map((axis, i) => {
    const angle = (2 * Math.PI * i) / n
    const r = maxR * (axis.value / 100)
    return polarToCartesian(cx, cy, r, angle)
  })
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ')
  const labelR = maxR * (isMobile ? 1.22 : 1.28)

  const setHover = (axisId: string | null) => {
    setInternalHovered(axisId)
    onHoverAxis?.(axisId)
  }

  return (
    <div className="relative mx-auto w-full max-w-[440px]" style={{ width: size, height: size, maxWidth: '100%', maxHeight: size }}>
      <div
        className="absolute inset-[14%] rounded-full hud-orbit-ring"
        style={{ boxShadow: `0 0 46px ${systemState.color}18, inset 0 0 36px rgba(96,165,250,0.04)` }}
      />
      <div className="absolute inset-[24%] rounded-full border border-white/5" />
      <div className="absolute inset-[34%] rounded-full border border-white/5" />

      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        <defs>
          <radialGradient id="radar-core-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(96,165,250,0.22)" />
            <stop offset="55%" stopColor="rgba(96,165,250,0.08)" />
            <stop offset="100%" stopColor="rgba(96,165,250,0)" />
          </radialGradient>
        </defs>

        <circle cx={cx} cy={cy} r={maxR * 1.04} fill="url(#radar-core-glow)" />

        {levels.map((frac, li) => (
          <polygon
            key={li}
            points={levelPoints(frac)}
            fill="none"
            stroke={li === levels.length - 1 ? '#3a465f' : '#243048'}
            strokeWidth={li === levels.length - 1 ? 1.2 : 1}
            opacity={li === levels.length - 1 ? 0.9 : 0.7}
          />
        ))}

        {axes.map((axis, i) => {
          const angle = (2 * Math.PI * i) / n
          const end = polarToCartesian(cx, cy, maxR, angle)
          const isHovered = hovered === axis.id
          return (
            <line
              key={axis.id}
              x1={cx}
              y1={cy}
              x2={end.x}
              y2={end.y}
              stroke={isHovered ? axis.color : '#2a3040'}
              strokeWidth={isHovered ? 1.8 : 1}
              opacity={isHovered ? 0.95 : 0.6}
              style={{ filter: isHovered ? `drop-shadow(0 0 6px ${axis.color})` : 'none', transition: 'all 0.15s ease' }}
            />
          )
        })}

        <polygon
          points={dataPolygon}
          fill="rgba(96,165,250,0.09)"
          stroke="rgba(96,165,250,0.72)"
          strokeWidth={2}
          className="radar-fill"
        />

        {dataPoints.map((p, i) => {
          const axis = axes[i]
          const isHovered = hovered === axis.id
          return (
            <g
              key={axis.id}
              onMouseEnter={() => setHover(axis.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => setHover(hovered === axis.id ? null : axis.id)}
              onTouchStart={() => setHover(axis.id)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={isHovered ? 10 : 6.5}
                fill={`${axis.color}${isHovered ? '22' : '14'}`}
                style={{ filter: isHovered ? `drop-shadow(0 0 10px ${axis.color})` : 'none', transition: 'all 0.15s ease' }}
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={isHovered ? 5.5 : 4}
                fill={axis.color}
                stroke="#0a0e1a"
                strokeWidth={isHovered ? 2.2 : 1.5}
              />
            </g>
          )
        })}

        {axes.map((axis, i) => {
          const angle = (2 * Math.PI * i) / n
          const lp = polarToCartesian(cx, cy, labelR, angle)
          const isHovered = hovered === axis.id
          let textAnchor: 'start' | 'middle' | 'end' = 'middle'
          const sinA = Math.sin(angle)
          if (sinA > 0.2) textAnchor = 'start'
          else if (sinA < -0.2) textAnchor = 'end'

          return (
            <g
              key={axis.id}
              onMouseEnter={() => setHover(axis.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => setHover(hovered === axis.id ? null : axis.id)}
              onTouchStart={() => setHover(axis.id)}
              style={{ cursor: 'pointer' }}
            >
              <text
                x={lp.x}
                y={lp.y - 3}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                fontSize={isMobile ? (isHovered ? 9 : 8) : (isHovered ? 11 : 9.5)}
                fontWeight={700}
                fill={isHovered ? axis.color : '#94a3b8'}
                fontFamily="'JetBrains Mono', ui-monospace, monospace"
                letterSpacing={isMobile ? '0.06em' : '0.12em'}
              >
                {isMobile ? (MOBILE_LABELS[axis.id] ?? axis.label.slice(0, 4).toUpperCase()) : axis.label.toUpperCase()}
              </text>
              <text
                x={lp.x}
                y={lp.y + 13}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                fontSize={11}
                fontWeight={700}
                fill={axis.color}
                fontFamily="'JetBrains Mono', ui-monospace, monospace"
                opacity={isHovered ? 1 : 0.82}
              >
                {axis.value}
              </text>
            </g>
          )
        })}

        <circle cx={cx} cy={cy} r={maxR * 0.28} fill="rgba(10,14,26,0.92)" stroke={`${systemState.color}55`} strokeWidth={1.2} />
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fontSize={17}
          fontWeight={700}
          fill={systemState.color}
          fontFamily="'JetBrains Mono', ui-monospace, monospace"
          letterSpacing="0.18em"
        >
          {systemState.label}
        </text>
        <text
          x={cx}
          y={cy + 18}
          textAnchor="middle"
          fontSize={8.5}
          fill="#94a3b8"
          fontFamily="'JetBrains Mono', ui-monospace, monospace"
          letterSpacing="0.14em"
          opacity={0.72}
        >
          {systemState.sub}
        </text>
        {timestamp && (
          <text
            x={cx}
            y={cy + 33}
            textAnchor="middle"
            fontSize={8}
            fill="#64748b"
            fontFamily="'JetBrains Mono', ui-monospace, monospace"
            letterSpacing="0.16em"
            opacity={0.88}
          >
            {timestamp.replace(/\./g, '').trim().toUpperCase()}
          </text>
        )}
      </svg>

      {hovered && (() => {
        const axis = axes.find(a => a.id === hovered)
        if (!axis) return null
        return (
          <div
            className="absolute left-1/2 top-full z-50 mt-2 w-[min(92vw,360px)] -translate-x-1/2 border px-3 py-2 text-xs sm:w-max sm:whitespace-nowrap"
            style={{
              background: '#161d2b',
              borderColor: axis.color,
              color: '#e2e8f0',
              boxShadow: `0 0 18px ${axis.color}28`,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            }}
          >
            <span style={{ color: axis.color }}>{axis.label.toUpperCase()}</span>
            <span className="mx-2 opacity-40">|</span>
            <span>{axis.value}/100</span>
            <span className="mx-2 opacity-40">|</span>
            <span className="opacity-70">{axis.summary}</span>
          </div>
        )
      })()}
    </div>
  )
}
