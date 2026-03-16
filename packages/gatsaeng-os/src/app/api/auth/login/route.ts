import { NextRequest, NextResponse } from 'next/server'
import { signToken, checkCredentials, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/auth'

// Rate limiting (in-memory, resets on restart)
const attempts = new Map<string, { count: number; resetAt: number }>()

function getRateLimit(ip: string) {
  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || entry.resetAt < now) {
    return { count: 0, resetAt: now + 15 * 60 * 1000 }
  }
  return entry
}

export async function POST(req: NextRequest) {
  if (!process.env.SESSION_SECRET) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  const limit = getRateLimit(ip)

  if (limit.count >= 10) {
    attempts.set(ip, limit)
    return NextResponse.json(
      { error: 'Too many attempts. Try again in 15 minutes.' },
      { status: 429, headers: { 'Retry-After': '900' } }
    )
  }

  const { username, password } = await req.json()

  if (!checkCredentials(username, password)) {
    attempts.set(ip, { count: limit.count + 1, resetAt: limit.resetAt })
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  // Reset on success
  attempts.delete(ip)

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
