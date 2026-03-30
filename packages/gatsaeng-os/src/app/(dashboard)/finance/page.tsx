'use client'

import { DollarSign, BarChart2, PieChart, ShieldCheck, TrendingUp, Landmark, Info } from 'lucide-react'
import { HudAxisPage, HudCard, HudDataPending } from '@/components/layout/HudAxisPage'

function MetricCell({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="border px-3 py-3" style={{ borderColor: `${accent}30`, background: `${accent}08` }}>
      <div className="hud-label mb-1" style={{ color: accent }}>{label}</div>
      <div className="hud-mono text-xl font-bold" style={{ color: '#e2e8f0' }}>{value}</div>
    </div>
  )
}

export default function FinancePage() {
  const color = '#10b981'

  return (
    <HudAxisPage
      title="FINANCE"
      subtitle="자산·현금흐름·투자를 한눈에. 재정 자유를 향한 숫자 관리." 
      icon={<DollarSign className="w-6 h-6" />}
      color={color}
      score={46}
    >
      <HudCard title="PRIMARY GAUGE" color={color} icon={<TrendingUp className="w-4 h-4" />} topRight="CAPITAL BUS">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCell label="NET" value="--" accent={color} />
          <MetricCell label="FLOW" value="--" accent={color} />
          <MetricCell label="RESERVE" value="--" accent={color} />
          <MetricCell label="RISK" value="--" accent={color} />
        </div>
        <HudDataPending />
      </HudCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <HudCard title="ASSET ALLOCATION" color={color} icon={<PieChart className="w-4 h-4" />}>
          <div className="space-y-3">
            {['Cash Buffer', 'Long-Term Holdings', 'Opportunity Pool'].map((item, i) => (
              <div key={item} className="border px-3 py-3" style={{ borderColor: `${color}26`, background: 'rgba(16,185,129,0.05)' }}>
                <div className="flex items-center justify-between">
                  <span className="hud-label" style={{ color }}>{item}</span>
                  <span className="hud-mono text-sm text-foreground">--%</span>
                </div>
                <div className="mt-2 h-1.5 bg-[#0f1726] border border-white/5 overflow-hidden">
                  <div className="h-full" style={{ width: `${34 + i * 12}%`, background: color, opacity: 0.4 }} />
                </div>
              </div>
            ))}
          </div>
        </HudCard>

        <HudCard title="PORTFOLIO FEED" color={color} icon={<BarChart2 className="w-4 h-4" />}>
          <div className="space-y-3">
            {['Equity', 'Macro', 'Private Bets'].map(item => (
              <div key={item} className="border px-3 py-3" style={{ borderColor: 'rgba(42,48,64,0.9)' }}>
                <div className="flex items-center justify-between">
                  <span className="hud-label">{item}</span>
                  <span className="hud-mono text-sm text-muted-foreground">--</span>
                </div>
                <HudDataPending />
              </div>
            ))}
          </div>
        </HudCard>

        <HudCard title="STABILITY CHECK" color={color} icon={<ShieldCheck className="w-4 h-4" />}>
          <div className="space-y-3">
            {['Runway', 'Obligation Load', 'Emergency Coverage'].map(item => (
              <div key={item} className="flex items-center justify-between border px-3 py-3" style={{ borderColor: `${color}22`, background: 'rgba(255,255,255,0.02)' }}>
                <span className="hud-label">{item}</span>
                <span className="hud-mono text-sm" style={{ color }}>--</span>
              </div>
            ))}
          </div>
        </HudCard>
      </div>

      <div className="border px-4 py-3 flex items-start gap-3" style={{ background: 'rgba(59,130,246,0.05)', borderColor: 'rgba(59,130,246,0.2)' }}>
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          invest-analyst의 실제 분석은 <span className="text-foreground font-medium">Work 축</span>에서 확인하세요.
          이 페이지는 재무 HUD 프레임을 유지하며 presentation만 강화했습니다.
        </p>
      </div>

      <HudCard title="INSTITUTION LINK" color={color} icon={<Landmark className="w-4 h-4" />}>
        <HudDataPending label="DATA LINK PENDING... BANK / BROKER / CASHFLOW" />
      </HudCard>
    </HudAxisPage>
  )
}
