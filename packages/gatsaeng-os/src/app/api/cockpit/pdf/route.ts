import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const REPORTS_DIR = path.resolve(
  process.env.REPORTS_DIR || path.join(process.env.HOME || '', 'Documents/EVE-obsidian/EVE/Daily Reports')
)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const filename = searchParams.get('file')

  if (!filename || filename.length > 256) {
    return new NextResponse('Bad request', { status: 400 })
  }

  // Resolve and use path.relative to assert containment (case-insensitive fs safe)
  const filePath = path.resolve(REPORTS_DIR, filename)
  const rel = path.relative(REPORTS_DIR, filePath)
  if (rel.startsWith('..') || path.isAbsolute(rel) || !filePath.endsWith('.pdf')) {
    return new NextResponse('Not found', { status: 404 })
  }

  try {
    const buffer = await fs.readFile(filePath)
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${path.basename(filename).replace(/["\r\n]/g, '_')}"`,
      },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
