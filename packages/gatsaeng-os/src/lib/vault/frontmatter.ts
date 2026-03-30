import matter from 'gray-matter'
import type { ZodSchema } from 'zod'

export interface ParsedFile<T> {
  data: T
  content: string
}

function coerceDates(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value instanceof Date) {
      result[key] = value.toISOString()
    } else if (Array.isArray(value)) {
      result[key] = value.map(v => v instanceof Date ? v.toISOString() : v)
    } else {
      result[key] = value
    }
  }
  return result
}

export function parseMarkdown<T>(raw: string, schema?: ZodSchema<T>): ParsedFile<T> {
  const { data, content } = matter(raw)
  const coerced = coerceDates(data)
  if (schema) {
    const parsed = schema.parse(coerced)
    return { data: parsed, content: content.trim() }
  }
  return { data: coerced as T, content: content.trim() }
}

export function safeParseMarkdown<T>(
  raw: string,
  schema: ZodSchema<T>,
  filename?: string,
): ParsedFile<T> | null {
  try {
    const { data, content } = matter(raw)
    const coerced = coerceDates(data)
    const result = schema.safeParse(coerced)
    if (result.success) {
      return { data: result.data, content: content.trim() }
    }
    console.warn(
      `[vault] Schema parse failed${filename ? ` for ${filename}` : ''}:`,
      result.error.issues.slice(0, 3).map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
    )
    return null
  } catch (e) {
    console.error('[vault] parseMarkdown failed:', e instanceof Error ? e.message : e)
    return null
  }
}

function stripUndefined(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(stripUndefined)
  if (obj && typeof obj === 'object' && !(obj instanceof Date)) {
    const clean: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) clean[k] = stripUndefined(v)
    }
    return clean
  }
  return obj
}

export function stringifyMarkdown(data: object, content?: string): string {
  return matter.stringify(content || '', stripUndefined(data) as Record<string, unknown>)
}

export function extractBodySections(content: string): Record<string, string> {
  const sections: Record<string, string> = {}
  const lines = content.split('\n')
  let currentSection = ''
  let currentContent: string[] = []

  for (const line of lines) {
    const headerMatch = line.match(/^##\s+(.+)$/)
    if (headerMatch) {
      if (currentSection) {
        sections[currentSection] = currentContent.join('\n').trim()
      }
      currentSection = headerMatch[1]
      currentContent = []
    } else if (currentSection) {
      currentContent.push(line)
    }
  }

  if (currentSection) {
    sections[currentSection] = currentContent.join('\n').trim()
  }

  return sections
}

export function buildBodyFromSections(sections: Record<string, string>): string {
  return Object.entries(sections)
    .filter(([, value]) => value)
    .map(([key, value]) => `## ${key}\n${value}`)
    .join('\n\n')
}
