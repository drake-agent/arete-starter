import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login).*)'],
}

if (!process.env.SESSION_SECRET) {
  throw new Error('[middleware] SESSION_SECRET env var is required. Set it in .env.local')
}
const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET)

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Public routes
  if (pathname.startsWith('/login') || pathname === '/api/auth/login' || pathname === '/api/auth/logout') {
    return NextResponse.next()
  }

  const token = req.cookies.get('gs_auth')?.value

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    await jwtVerify(token, SECRET)
    return NextResponse.next()
  } catch {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.delete('gs_auth')
    return res
  }
}
