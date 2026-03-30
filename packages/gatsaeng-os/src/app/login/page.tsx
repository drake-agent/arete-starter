'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function hexPath(cx: number, cy: number, r: number): string {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30)
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
  })
  return `M ${pts.join(' L ')} Z`
}

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) {
        let message = 'Login failed'
        try {
          const data = await res.json()
          message = data.error || message
        } catch {
          // no-op
        }
        setError(message)
        return
      }

      router.replace('/')
      router.refresh()
      window.location.assign('/')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-6 sm:px-6" style={{ background: '#0a0e1a' }}>
      <div className="absolute inset-0 hud-grid-bg opacity-60" />
      <div className="absolute inset-0 hud-vignette" />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <svg width="900" height="900" viewBox="0 0 900 900" className="absolute hidden sm:block hex-spin-slow opacity-[0.16]">
          {[0, 1, 2, 3, 4, 5].map(i => {
            const colors = ['#f59e0b', '#3b82f6', '#f43f5e', '#10b981', '#8b5cf6', '#14b8a6']
            return <path key={i} d={hexPath(450, 450, 340 - i * 24)} fill="none" stroke={colors[i]} strokeWidth={1.1} opacity={0.85} />
          })}
        </svg>
        <svg width="520" height="520" viewBox="0 0 520 520" className="absolute hidden sm:block hex-spin-reverse-slow opacity-[0.22]">
          {[0, 1, 2, 3].map(i => {
            const colors = ['#60a5fa', '#8b5cf6', '#14b8a6', '#f59e0b']
            return <path key={i} d={hexPath(260, 260, 210 - i * 22)} fill="none" stroke={colors[i]} strokeWidth={1.2} opacity={0.8} />
          })}
        </svg>
        <svg width="360" height="360" viewBox="0 0 360 360" className="absolute sm:hidden hex-spin-slow opacity-[0.14]">
          {[0, 1, 2, 3].map(i => {
            const colors = ['#60a5fa', '#8b5cf6', '#14b8a6', '#f59e0b']
            return <path key={i} d={hexPath(180, 180, 132 - i * 18)} fill="none" stroke={colors[i]} strokeWidth={1} opacity={0.8} />
          })}
        </svg>
      </div>

      <div
        className="relative z-10 w-full max-w-sm hud-scanlines hud-frame-corners p-5 sm:p-8"
        style={{
          background: 'rgba(16,24,39,0.9)',
          border: '1px solid rgba(42,48,64,0.95)',
          boxShadow: '0 0 40px rgba(59,130,246,0.12)',
          backdropFilter: 'blur(14px)',
        }}
      >
        <div className="absolute top-0 left-6 right-6 h-px sm:left-8 sm:right-8" style={{ background: 'linear-gradient(90deg, transparent, #60a5fa, transparent)' }} />

        <div className="mb-6 text-center sm:mb-8">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center border border-blue-400/30 bg-blue-400/10 sm:h-14 sm:w-14">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2 L20.9 7.5 V16.5 L12 22 L3.1 16.5 V7.5 Z" stroke="#60a5fa" strokeWidth="1.5" fill="rgba(96,165,250,0.08)" />
              <circle cx="12" cy="12" r="2.4" fill="#60a5fa" opacity="0.85" />
              <circle cx="12" cy="5.2" r="1.1" fill="#f59e0b" />
              <circle cx="17.8" cy="8.6" r="1.1" fill="#10b981" />
              <circle cx="17.8" cy="15.4" r="1.1" fill="#14b8a6" />
              <circle cx="12" cy="18.8" r="1.1" fill="#8b5cf6" />
              <circle cx="6.2" cy="15.4" r="1.1" fill="#f43f5e" />
              <circle cx="6.2" cy="8.6" r="1.1" fill="#3b82f6" />
            </svg>
          </div>
          <h1 className="hud-mono text-base font-bold uppercase tracking-[0.22em] text-[#e2e8f0] sm:text-lg">ARETE</h1>
          <p className="hud-mono mt-1 text-[10px] uppercase tracking-[0.22em] text-[#94a3b8] sm:text-xs">Mission Control Access</p>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
          <div>
            <label className="hud-mono mb-1.5 block text-[10px] uppercase tracking-[0.22em] text-[#94a3b8]">Identifier</label>
            <input
              type="text"
              placeholder="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="hud-mono min-h-[44px] w-full border border-[#2a3040] bg-[#0d1524] px-3 py-3 text-sm text-[#e2e8f0] outline-none transition-all focus:border-blue-400/60 focus:shadow-[0_0_12px_rgba(96,165,250,0.14)]"
            />
          </div>

          <div>
            <label className="hud-mono mb-1.5 block text-[10px] uppercase tracking-[0.22em] text-[#94a3b8]">Access Key</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="hud-mono min-h-[44px] w-full border border-[#2a3040] bg-[#0d1524] px-3 py-3 text-sm text-[#e2e8f0] outline-none transition-all focus:border-blue-400/60 focus:shadow-[0_0_12px_rgba(96,165,250,0.14)]"
            />
          </div>

          {error && (
            <div className="hud-mono border px-3 py-2 text-xs text-[#f43f5e]" style={{ background: 'rgba(244,63,94,0.1)', borderColor: 'rgba(244,63,94,0.3)' }}>
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="hud-mono min-h-[46px] w-full border border-blue-400/40 bg-blue-400/15 py-3 text-sm font-bold uppercase tracking-[0.22em] text-blue-300 transition-all hover:bg-blue-400/26 hover:shadow-[0_0_18px_rgba(96,165,250,0.2)] active:scale-[0.99] active:bg-blue-400/32 disabled:opacity-50"
          >
            {loading ? 'AUTHENTICATING...' : 'INITIATE ACCESS'}
          </button>
        </form>

        <div className="relative z-10 mt-5 flex items-center gap-2 sm:mt-6">
          <div className="status-dot-good h-1.5 w-1.5 rounded-full" />
          <span className="hud-mono text-[9px] uppercase tracking-[0.2em] text-[#94a3b8]">System Nominal</span>
          <span className="hud-mono ml-auto text-[9px] text-[#2a3040]">ARETE v0.2</span>
        </div>
      </div>
    </div>
  )
}
