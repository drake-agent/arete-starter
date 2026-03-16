/**
 * Shared API fetch with error handling.
 * All hooks should use this instead of raw fetch + .json().
 */
export async function apiFetch<T = void>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    let detail = ''
    try { const body = await res.json(); detail = body.error || body.message || '' } catch {}
    throw new Error(detail ? `HTTP ${res.status}: ${detail}` : `HTTP ${res.status}`)
  }
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}
