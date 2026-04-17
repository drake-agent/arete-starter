import { NextResponse } from 'next/server'

/**
 * Parse request JSON body with graceful error handling.
 * Returns [body, null] on success, [null, errorResponse] on failure.
 *
 * Usage:
 *   const [body, err] = await safeJson(req)
 *   if (err) return err
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function safeJson<T = any>(
  req: Request
): Promise<[T, null] | [null, NextResponse]> {
  try {
    const body = (await req.json()) as T
    return [body, null]
  } catch {
    return [null, NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })]
  }
}

/**
 * Return a safe, non-leaking error response.
 * Logs the real error server-side; returns generic message to client.
 */
export function serverError(label: string, e: unknown): NextResponse {
  console.error(`[${label}]`, e)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
