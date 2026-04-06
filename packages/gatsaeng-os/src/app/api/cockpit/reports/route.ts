import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const REPORTS_DIR = path.join(
  process.env.REPORTS_DIR || path.join(process.env.HOME || '', 'Documents/EVE-obsidian/EVE/Daily Reports')
)

export type ReportCategory = 'invest' | 'beauty' | 'saju' | 'general'

function categorize(filename: string): ReportCategory {
  const lower = filename.toLowerCase()
  if (lower.includes('invest') || lower.includes('1200') || lower.includes('strategy') || lower.includes('prescan')) return 'invest'
  if (lower.includes('beauty')) return 'beauty'
  if (lower.includes('saju') || lower.includes('hyde') || lower.includes('사주')) return 'saju'
  return 'general'
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') as ReportCategory | null

  try {
    const files = fs.readdirSync(REPORTS_DIR)
    const pdfs = files
      .filter((f) => f.endsWith('.pdf'))
      .map((f) => {
        const stat = fs.statSync(path.join(REPORTS_DIR, f))
        return {
          filename: f,
          category: categorize(f),
          modifiedAt: stat.mtime.toISOString(),
          sizeKb: Math.round(stat.size / 1024),
        }
      })
      .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))

    const filtered = category ? pdfs.filter((p) => p.category === category) : pdfs

    return NextResponse.json({ reports: filtered.slice(0, 20) })
  } catch {
    return NextResponse.json({ reports: [] })
  }
}
