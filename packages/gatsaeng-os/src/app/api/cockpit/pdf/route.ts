import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const REPORTS_DIR = path.join(
  process.env.REPORTS_DIR || path.join(process.env.HOME || '', 'Documents/EVE-obsidian/EVE/Daily Reports')
)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const filename = searchParams.get('file')

  if (!filename) {
    return new NextResponse('Bad request', { status: 400 })
  }

  // Resolve to absolute and verify it stays within REPORTS_DIR (prevents path traversal)
  const filePath = path.resolve(REPORTS_DIR, filename)

  if (!filePath.startsWith(REPORTS_DIR + path.sep) || !filePath.endsWith('.pdf')) {
    return new NextResponse('Not found', { status: 404 })
  }

  if (!fs.existsSync(filePath)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const buffer = fs.readFileSync(filePath)
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${path.basename(filename).replace(/["\r\n]/g, '_')}"`,
    },
  })
}
