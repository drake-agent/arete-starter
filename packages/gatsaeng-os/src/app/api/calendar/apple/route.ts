import { NextResponse } from 'next/server'
import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { inferCategory } from '@/lib/calendar/inferCategory'

const execFileAsync = promisify(execFile)

const OPENCLAW_WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(process.env.HOME || '', '.openclaw/workspace')

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const daysParam = searchParams.get('days') || '7'
  const days = Math.min(Math.max(parseInt(daysParam, 10) || 7, 1), 30)

  try {
    const { stdout } = await execFileAsync(
      'swift',
      [`${OPENCLAW_WORKSPACE}/plaud/scripts/read_calendar.swift`, String(days), 'json'],
      { timeout: 15000, encoding: 'utf-8' }
    )
    const events = JSON.parse(stdout)
    // 각 이벤트에 추론된 카테고리 추가
    const enriched = events.map((e: { title: string; location?: string; calendar: string }) => ({
      ...e,
      category: inferCategory(e),
    }))
    return NextResponse.json(enriched)
  } catch (e) {
    console.error('[calendar/apple]', e)
    // Return empty list but signal degraded state so the client can warn if needed
    return NextResponse.json([], { status: 200, headers: { 'X-Calendar-Status': 'degraded' } })
  }
}
