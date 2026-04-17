/**
 * LLM Call Governor — Layer 5 Runtime Governance
 * Based on Matthew Berman's OpenClaw security design
 *
 * Protection layers:
 * 1. Spend limit  — sliding 5-min window, hard cap $15
 * 2. Volume limit — 200 calls/10min global, per-caller overrides
 * 3. Lifetime counter — 500 calls/process max
 * 4. Duplicate detection — hash cache, TTL 60s
 */

type CallerConfig = {
  maxPer10Min?: number
}

const CALLERS: Record<string, CallerConfig> = {
  'voice/chat': { maxPer10Min: 40 },
  'voice/transcribe': { maxPer10Min: 60 },
  'voice/tts': { maxPer10Min: 60 },
  'cockpit/card-builder': { maxPer10Min: 20 },
  'default': { maxPer10Min: 200 },
}

// Pricing units are NORMALIZED per caller — each estimate function below
// returns a USD cost directly, so we don't have to special-case units
// (chars vs bytes vs minutes) inside estimateCost.
const COST_PER_1K_TOKENS: Record<string, number> = {
  'gpt-4o': 0.0125,        // blended input+output
  'gpt-4o-mini': 0.0006,
  'default': 0.010,
}
const WHISPER_PER_MB = 0.006   // conservative: 1MB audio ≈ ~1min
const TTS_PER_1K_CHARS = 0.015

// --- In-memory state (resets on process restart) ---
const state = {
  lifetimeCount: 0,
  spendWindow: [] as { ts: number; cost: number }[],
  volumeWindow: [] as { ts: number; caller: string }[],
  callerCounts: new Map<string, { ts: number }[]>(),
  hashCache: new Map<string, { result: unknown; ts: number }>(),
}

const LIFETIME_LIMIT = 500
const SPEND_WINDOW_MS = 5 * 60 * 1000   // 5 min
const SPEND_WARN = 5    // $5
const SPEND_HARD = 15   // $15
const VOLUME_WINDOW_MS = 10 * 60 * 1000 // 10 min
const VOLUME_GLOBAL = 200
const HASH_TTL_MS = 60 * 1000           // 60s

function now() { return Date.now() }

function pruneWindow<T extends { ts: number }>(arr: T[], windowMs: number): T[] {
  const cutoff = now() - windowMs
  return arr.filter(e => e.ts > cutoff)
}

const MAX_CACHE_SIZE = 1000

export function hashPrompt(prompt: string): string {
  // djb2 hash over full string for better collision resistance
  let h = 5381
  for (let i = 0; i < prompt.length; i++) {
    h = ((h << 5) + h) ^ prompt.charCodeAt(i)
    h = h >>> 0
  }
  return h.toString(16)
}

function pruneCache(): void {
  // Evict oldest entries when cache exceeds limit
  if (state.hashCache.size > MAX_CACHE_SIZE) {
    const entries = [...state.hashCache.entries()].sort((a, b) => a[1].ts - b[1].ts)
    const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE)
    for (const [key] of toRemove) {
      state.hashCache.delete(key)
    }
  }
  // Evict stale callerCounts keys
  const cutoff = now() - VOLUME_WINDOW_MS
  for (const [key, arr] of state.callerCounts) {
    const live = arr.filter(e => e.ts > cutoff)
    if (live.length === 0) {
      state.callerCounts.delete(key)
    } else {
      state.callerCounts.set(key, live)
    }
  }
}

export type GovernorResult =
  | { ok: true; cached: false }
  | { ok: true; cached: true; result: unknown }
  | { ok: false; reason: string; code: 'SPEND_LIMIT' | 'VOLUME_LIMIT' | 'LIFETIME_LIMIT' }

/**
 * Check before making an LLM call.
 * @param caller  e.g. 'voice/chat', 'voice/transcribe'
 * @param prompt  The prompt text (for dedup hash)
 * @param model   Model name key (for cost estimate)
 */
export function governorCheck(
  caller: string,
  prompt: string,
  model = 'default'
): GovernorResult {
  // 1. Lifetime limit
  if (state.lifetimeCount >= LIFETIME_LIMIT) {
    return { ok: false, reason: `Lifetime LLM call limit reached (${LIFETIME_LIMIT})`, code: 'LIFETIME_LIMIT' }
  }

  // 2. Spend window
  state.spendWindow = pruneWindow(state.spendWindow, SPEND_WINDOW_MS)
  const totalSpend = state.spendWindow.reduce((s, e) => s + e.cost, 0)
  if (totalSpend >= SPEND_HARD) {
    return { ok: false, reason: `Spend hard cap hit ($${SPEND_HARD}/5min). Current: $${totalSpend.toFixed(3)}`, code: 'SPEND_LIMIT' }
  }
  if (totalSpend >= SPEND_WARN) {
    console.warn(`[llm-governor] ⚠️ Spend warning: $${totalSpend.toFixed(3)} in last 5min (limit $${SPEND_HARD})`)
  }

  // 3. Global volume window
  state.volumeWindow = pruneWindow(state.volumeWindow, VOLUME_WINDOW_MS)
  if (state.volumeWindow.length >= VOLUME_GLOBAL) {
    return { ok: false, reason: `Global volume limit hit (${VOLUME_GLOBAL}/10min)`, code: 'VOLUME_LIMIT' }
  }

  // 4. Per-caller volume
  const callerCfg = CALLERS[caller] ?? CALLERS['default']
  const callerMax = callerCfg.maxPer10Min ?? 200
  const callerWindow = pruneWindow(state.callerCounts.get(caller) ?? [], VOLUME_WINDOW_MS)
  if (callerWindow.length >= callerMax) {
    return { ok: false, reason: `Caller ${caller} volume limit hit (${callerMax}/10min)`, code: 'VOLUME_LIMIT' }
  }

  // 5. Duplicate detection
  const hash = hashPrompt(prompt)
  const cached = state.hashCache.get(hash)
  if (cached && now() - cached.ts < HASH_TTL_MS) {
    console.log(`[llm-governor] Cache hit for ${caller} (hash ${hash})`)
    return { ok: true, cached: true, result: cached.result }
  }

  return { ok: true, cached: false }
}

/**
 * Record a completed LLM call (update spend + volume windows).
 * ALWAYS increments counters, even on cache hits — that's by design:
 * a cache hit still serves a user, so it counts toward per-caller volume
 * (just with zero incremental spend). Callers pass cost=0 for cache hits.
 */
export function governorRecord(
  caller: string,
  estimatedCost: number,
  promptHash?: string,
  result?: unknown
) {
  const t = now()
  state.lifetimeCount++
  state.spendWindow.push({ ts: t, cost: estimatedCost })
  state.volumeWindow.push({ ts: t, caller })

  const callerWindow = pruneWindow(state.callerCounts.get(caller) ?? [], VOLUME_WINDOW_MS)
  callerWindow.push({ ts: t })
  state.callerCounts.set(caller, callerWindow)

  if (promptHash && result !== undefined) {
    state.hashCache.set(promptHash, { result, ts: t })
  }

  pruneCache()
}

/**
 * Record a cache-hit serve (volume only, no spend).
 * Prevents cache-key-collision bypass of per-caller rate limits.
 */
export function governorRecordCacheHit(caller: string) {
  governorRecord(caller, 0)
}

/**
 * Chat-model cost estimator. Pass the FULL prompt (system + history + user)
 * and expected maxTokens for the completion — output is typically more
 * expensive than input, so we can't ignore it.
 */
export function estimateChatCost(
  model: string,
  promptChars: number,
  maxOutputTokens = 256
): number {
  const rate = COST_PER_1K_TOKENS[model] ?? COST_PER_1K_TOKENS['default']
  const inputTokens = promptChars / 4
  const estTokens = inputTokens + maxOutputTokens
  return (estTokens / 1000) * rate
}

/** Whisper cost estimator — billed per minute (~1MB/min conservative). */
export function estimateWhisperCost(audioBytes: number): number {
  return (audioBytes / (1024 * 1024)) * WHISPER_PER_MB
}

/** TTS cost estimator — $0.015 per 1K input characters. */
export function estimateTtsCost(chars: number): number {
  return (chars / 1000) * TTS_PER_1K_CHARS
}

/**
 * @deprecated Use model-specific estimators. Kept for backward compatibility.
 */
export function estimateCost(model: string, inputChars: number): number {
  if (model === 'whisper') return estimateWhisperCost(inputChars)
  if (model === 'tts') return estimateTtsCost(inputChars)
  return estimateChatCost(model, inputChars)
}

/**
 * Get current governor stats (for /api/status or logging).
 */
export function governorStats() {
  const t = now()
  const spendArr = pruneWindow(state.spendWindow, SPEND_WINDOW_MS)
  const volArr = pruneWindow(state.volumeWindow, VOLUME_WINDOW_MS)
  return {
    lifetimeCount: state.lifetimeCount,
    spendLast5Min: spendArr.reduce((s, e) => s + e.cost, 0).toFixed(4),
    callsLast10Min: volArr.length,
    cacheSize: state.hashCache.size,
  }
}
