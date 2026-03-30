import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const OPENCLAW_WORKSPACE = process.env.OPENCLAW_WORKSPACE || '/Users/drake/.openclaw/workspace'
const MEETING_INTEL_DIR = path.join(OPENCLAW_WORKSPACE, 'plaud/meeting-intel')

// In-memory cache to avoid re-scanning all files on every request
let cachedMeetings: unknown[] | null = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function GET() {
  const now = Date.now()
  if (cachedMeetings && now - cacheTimestamp < CACHE_TTL) {
    return NextResponse.json(cachedMeetings)
  }

  try {
    if (!fs.existsSync(MEETING_INTEL_DIR)) {
      return NextResponse.json([])
    }

    const dirs = fs.readdirSync(MEETING_INTEL_DIR).filter(d =>
      fs.statSync(path.join(MEETING_INTEL_DIR, d)).isDirectory()
    )

    const meetings = []
    for (const fileId of dirs) {
      const briefPath = path.join(MEETING_INTEL_DIR, fileId, 'meeting-brief.md')
      if (fs.existsSync(briefPath)) {
        const content = fs.readFileSync(briefPath, 'utf-8')

        // 제목, 날짜, 길이 파싱
        const title = content.match(/\*\*제목\*\*[：:]\s*(.+)/)?.[1]?.trim()
          || content.match(/제목[：:]\s*(.+)/)?.[1]?.trim()
          || fileId
        const date = content.match(/\*\*날짜\*\*[：:]\s*(.+)/)?.[1]?.trim()
          || content.match(/날짜[：:]\s*(.+)/)?.[1]?.trim()
          || ''
        const duration = content.match(/\*\*길이\*\*[：:]\s*(.+)/)?.[1]?.trim()
          || content.match(/길이[：:]\s*(.+)/)?.[1]?.trim()
          || ''

        // cross-domain 태그 파싱 — "높음" 포함 행만 추출
        const domains: string[] = []
        const domainList = ['Work', 'Finance', 'Relationship', 'Energy', 'Meaning', 'Lifestyle']
        for (const domain of domainList) {
          // | Work | 높음 | 형식의 행에서 "높음" 또는 "높" 포함된 것만
          const domainRegex = new RegExp(`\\|[^|]*${domain}[^|]*\\|[^|]*높`)
          if (domainRegex.test(content)) {
            domains.push(domain)
          }
        }

        // Drake 액션 항목 파싱
        const actionsSection = content.match(/### Drake 액션\n([\s\S]*?)(?=\n###|\n##|$)/)?.[1] || ''
        const drakeActions: Array<{ text: string; done: boolean }> = []
        for (const line of actionsSection.split('\n')) {
          const checked = line.match(/^- \[x\]\s+(.+)/i)
          const unchecked = line.match(/^- \[ \]\s+(.+)/)
          if (checked) drakeActions.push({ text: checked[1].trim(), done: true })
          else if (unchecked) drakeActions.push({ text: unchecked[1].trim(), done: false })
        }

        // Playbook candidates 파싱
        const playbookPath = path.join(MEETING_INTEL_DIR, fileId, 'playbook-candidate.json')
        let playbooks: unknown[] = []
        if (fs.existsSync(playbookPath)) {
          try {
            const raw = fs.readFileSync(playbookPath, 'utf-8')
            const parsed = JSON.parse(raw)
            // Support both array and single object
            playbooks = Array.isArray(parsed) ? parsed : [parsed]
          } catch {
            playbooks = []
          }
        }

        meetings.push({ fileId, title, date, duration, domains, drakeActions, playbooks })
      }
    }

    meetings.sort((a, b) => b.date.localeCompare(a.date))
    cachedMeetings = meetings
    cacheTimestamp = Date.now()
    return NextResponse.json(meetings)
  } catch {
    return NextResponse.json([])
  }
}
