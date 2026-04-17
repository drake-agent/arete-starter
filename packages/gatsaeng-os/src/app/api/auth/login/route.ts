import { NextRequest, NextResponse } from 'next/server'
import { signToken, checkCredentials, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/auth'

// Rate limiting (in-memory, resets on restart).
// Two keyed windows: per-IP (spoofable, soft limit) and per-username
// (not spoofable, hard limit — blocks horizontal brute force).
const attempts = new Map<string, { count: number; resetAt: number }>()
const usernameAttempts = new Map<string, { count: number; resetAt: number }>()

const WINDOW_MS = 15 * 60 * 1000
const IP_MAX = 10
const USERNAME_MAX = 20

function getWindow(store: Map<string, { count: number; resetAt: number }>, key: string) {
  const now = Date.now()
  const entry = store.get(key)
  if (!entry || entry.resetAt < now) {
    return { count: 0, resetAt: now + WINDOW_MS }
  }
  return entry
}

export async function POST(req: NextRequest) {
  if (!process.env.SESSION_SECRET) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  // NOTE: x-forwarded-for is spoofable. In production, configure your reverse proxy
  // (nginx, Cloudflare, etc.) to set a trusted header, or use req.ip with a trusted proxy.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown'
  const ipLimit = getWindow(attempts, ip)

  if (ipLimit.count >= IP_MAX) {
    attempts.set(ip, ipLimit)
    return NextResponse.json(
      { error: 'Too many attempts. Try again in 15 minutes.' },
      { status: 429, headers: { 'Retry-After': '900' } }
    )
  }

  let username: string, password: string
  try {
    const body = await req.json()
    username = typeof body.username === 'string' ? body.username : ''
    password = typeof body.password === 'string' ? body.password : ''
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Per-username lockout — not spoofable via headers
  const userLimit = getWindow(usernameAttempts, username)
  if (userLimit.count >= USERNAME_MAX) {
    usernameAttempts.set(username, userLimit)
    return NextResponse.json(
      { error: 'Account temporarily locked. Try again later.' },
      { status: 429, headers: { 'Retry-After': '900' } }
    )
  }

  if (!checkCredentials(username, password)) {
    attempts.set(ip, { count: ipLimit.count + 1, resetAt: ipLimit.resetAt })
    usernameAttempts.set(username, { count: userLimit.count + 1, resetAt: userLimit.resetAt })
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  // Reset on success (both windows)
  attempts.delete(ip)
  usernameAttempts.delete(username)

  const token = await signToken({ username })
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
  return res
}
