/**
 * Shared API fetch with error handling.
 * All hooks should use this instead of raw fetch + .json().
 */
export async function apiFetch<T = void>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}
