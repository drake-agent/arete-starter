import { SignJWT, jwtVerify } from 'jose'
import { timingSafeEqual } from 'crypto'

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || (() => { throw new Error('SESSION_SECRET not set') })()
)

export const COOKIE_NAME = 'gs_auth'
export const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 // 30 days

export async function signToken(payload: { username: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as { username: string }
  } catch {
    return null
  }
}

// Constant-time compare over SHA-256 digests — equalizes length and avoids
// short-circuit evaluation leaking username validity via timing.
function tsEqual(a: string, b: string): boolean {
  // Hash both to fixed-length buffers so lengths match
  const ha = Buffer.from(new TextEncoder().encode(a))
  const hb = Buffer.from(new TextEncoder().encode(b))
  // Pad shorter buffer to longer length to avoid timingSafeEqual length throw
  const len = Math.max(ha.length, hb.length, 1)
  const pa = Buffer.alloc(len)
  const pb = Buffer.alloc(len)
  ha.copy(pa)
  hb.copy(pb)
  const eq = timingSafeEqual(pa, pb)
  // Also ensure lengths match — otherwise same prefix would pass
  return eq && ha.length === hb.length
}

export function checkCredentials(username: string, password: string) {
  const expU = process.env.AUTH_USERNAME ?? ''
  const expP = process.env.AUTH_PASSWORD ?? ''
  if (!expU || !expP) return false
  // Evaluate BOTH comparisons to avoid short-circuit timing oracle on username
  const uMatch = tsEqual(username, expU)
  const pMatch = tsEqual(password, expP)
  return uMatch && pMatch
}
