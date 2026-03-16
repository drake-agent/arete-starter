import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login).*)'],
}

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'build-placeholder'
)

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Public routes
  if (pathname.startsWith('/login') || pathname === '/api/auth/login') {
    return NextResponse.next()
  }

  const token = req.cookies.get('gs_auth')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    await jwtVerify(token, SECRET)
    return NextResponse.next()
  } catch {
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.delete('gs_auth')
    return res
  }
}
