import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

const OPENCLAW_WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(process.env.HOME || '', '.openclaw/workspace')
const PENDING_PATH = path.join(OPENCLAW_WORKSPACE, 'Pending.md')
const MEMORY_PATH = path.join(OPENCLAW_WORKSPACE, 'MEMORY.md')
const HANDOFF_PATH = path.join(OPENCLAW_WORKSPACE, 'memory/handoff.md')

// Module-level TTL cache (single process env)
let _memCache: { pending: string; memory: string; ts: number } | null = null
const MEM_CACHE_TTL = 60_000 // 1 minute

function parsePendingItems(pendingContent?: string) {
  const rows: Array<{ id: string; title: string; priority: string; status: string }> = []
  if (!pendingContent) return rows
  try {
    // 🔴 HIGH 섹션만 파싱
    const highSection = pendingContent.match(/## 🔴 HIGH[^\n]*\n([\s\S]*?)(?=\n## |\n# |$)/)?.[1] || ''
    for (const line of highSection.split('\n')) {
      // - **P-022**: 오운 App Store 서명 + TestFlight
      const match = line.match(/^-\s+\*\*(P-\d+)\*\*[：:]\s*(.+)/)
      if (match) {
        rows.push({
          id: match[1].trim(),
          title: match[2].trim(),
          priority: '🔴 HIGH',
          status: '대기',
        })
      }
    }
  } catch {
    // Pending.md 없으면 빈 배열 반환
  }
  return rows
}

function parseActiveMissions(content: string) {
  const section = content.match(/## 🎯 Missions[\s\S]*?(?=\n##|\n# |$)/)?.[0] || ''
  const missions: string[] = []
  const lines = section.split('\n').slice(1)
  for (const line of lines) {
    const m = line.match(/^-\s*\*\*(.+?)\*\*:?\s*(.+)/)
    if (m) missions.push(`${m[1]}: ${m[2].slice(0, 80)}`)
  }
  return missions.slice(0, 4)
}

function parseHandoff(content: string) {
  // 내일 이어갈 것 섹션 파싱
  const nextActionsSection = content.match(/### 내일 이어갈 것[^\n]*\n([\s\S]*?)(?=\n###|\n##|$)/)?.[1] || ''
  const nextActions: string[] = []
  for (const line of nextActionsSection.split('\n')) {
    const m = line.match(/^-\s+(.+)/)
    if (m) nextActions.push(m[1].trim())
  }

  // 열린 결정 섹션 파싱
  const openDecisionsSection = content.match(/### 열린 결정[^\n]*\n([\s\S]*?)(?=\n###|\n##|$)/)?.[1] || ''
  const openDecisions: string[] = []
  for (const line of openDecisionsSection.split('\n')) {
    const m = line.match(/^-\s+(.+)/)
    if (m) openDecisions.push(m[1].trim())
  }

  // 에너지/패턴 메모 (Eve 제안으로 사용)
  const energySection = content.match(/### 에너지[^\n]*\n([\s\S]*?)(?=\n###|\n##|$)/)?.[1] || ''
  const energyNotes: string[] = []
  for (const line of energySection.split('\n')) {
    const m = line.match(/^-\s+(.+)/)
    if (m) energyNotes.push(m[1].trim())
  }

  // 날짜 파싱
  const dateMatch = content.match(/## Handoff[^\n]*(\d{4}-\d{2}-\d{2})/)
  const date = dateMatch?.[1] || ''

  return {
    date,
    nextActions: nextActions.slice(0, 5),
    openDecisions: openDecisions.slice(0, 3),
    eveSuggestions: energyNotes.slice(0, 2),
  }
}

export async function GET() {
  try {
    const now = Date.now()
    let pendingText = ''
    let memoryText = ''

    if (_memCache && now - _memCache.ts < MEM_CACHE_TTL) {
      pendingText = _memCache.pending
      memoryText = _memCache.memory
    } else {
      ;[pendingText, memoryText] = await Promise.all([
        readFile(PENDING_PATH, 'utf-8').catch(() => ''),
        readFile(MEMORY_PATH, 'utf-8').catch(() => ''),
      ])
      _memCache = { pending: pendingText, memory: memoryText, ts: now }
    }

    const pending = parsePendingItems(pendingText)
    const missions = parseActiveMissions(memoryText)

    // Today's memory log
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
    const dailyPath = path.join(OPENCLAW_WORKSPACE, `memory/${today}.md`)

    const [dailyRaw, handoffRaw] = await Promise.all([
      readFile(dailyPath, 'utf-8').catch(() => null),
      readFile(HANDOFF_PATH, 'utf-8').catch(() => null),
    ])

    const dailySummary = dailyRaw ? dailyRaw.slice(0, 500) : null
    const handoff = handoffRaw ? parseHandoff(handoffRaw) : null

    return NextResponse.json({
      pending,
      missions,
      dailySummary,
      handoff,
      updatedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ pending: [], missions: [], dailySummary: null, handoff: null, updatedAt: new Date().toISOString() })
  }
}
