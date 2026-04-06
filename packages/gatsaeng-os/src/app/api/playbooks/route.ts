import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const OPENCLAW_WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(process.env.HOME || '', '.openclaw/workspace')
const CANDIDATES_PATH = path.join(OPENCLAW_WORKSPACE, 'playbooks/candidates.jsonl')

export async function GET() {
  try {
    if (!fs.existsSync(CANDIDATES_PATH)) return NextResponse.json([])
    const lines = fs.readFileSync(CANDIDATES_PATH, 'utf-8').split('\n').filter(Boolean)
    const candidates = lines.map(line => {
      try { return JSON.parse(line) } catch { return null }
    }).filter(Boolean)
    return NextResponse.json(candidates)
  } catch {
    return NextResponse.json([])
  }
}
