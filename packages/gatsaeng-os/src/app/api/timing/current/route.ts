import { NextResponse } from 'next/server'
import { FOLDERS } from '@/lib/vault/config'
import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'

export async function GET() {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const dirPath = FOLDERS.timing

  try {
    const files = await fs.readdir(dirPath)
    const mdFiles = files.filter(f => f.endsWith('.md'))

    // Find all matching periods, prefer the one with latest start (boundary = new month)
    let bestMatch: Record<string, unknown> | null = null
    let bestStart = ''

    for (const file of mdFiles) {
      const raw = await fs.readFile(path.join(dirPath, file), 'utf-8')
      const { data } = matter(raw)

      const start = data.period_start instanceof Date
        ? data.period_start.toISOString().slice(0, 10)
        : String(data.period_start || '')
      const end = data.period_end instanceof Date
        ? data.period_end.toISOString().slice(0, 10)
        : String(data.period_end || '')

      if (start && end && today >= start && today <= end) {
        if (!bestMatch || start > bestStart) {
          bestMatch = data
          bestStart = start
        }
      }
    }

    if (bestMatch) {
      const data = bestMatch
      const actionItems = typeof data.action_guide === 'string'
        ? data.action_guide.split(/[,、]/).map((s: string) => s.trim()).filter(Boolean)
        : Array.isArray(data.action_guide) ? data.action_guide : []

      return NextResponse.json({
        month: data.month_name || '',
        pillar: data.month_hanja || '',
        heavenly_stem: (data.month_hanja as string)?.[0] || '',
        earthly_branch: (data.month_hanja as string)?.[1] || '',
        rating: data.rating || 3,
        theme: data.theme || '',
        insight: data.key_insight || '',
        action_guide: actionItems,
        caution: data.caution ? (Array.isArray(data.caution) ? data.caution : [data.caution]) : [],
      })
    }

    return NextResponse.json(null, { status: 404 })
  } catch (err) {
    console.error('[timing/current]', err instanceof Error ? err.message : err)
    return NextResponse.json(null, { status: 404 })
  }
}
