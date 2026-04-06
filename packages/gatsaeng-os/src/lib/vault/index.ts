import fs from 'fs/promises'
import path from 'path'
import { nanoid } from 'nanoid'
import { FOLDERS, PROFILE_PATH, type FolderKey } from './config'
import { parseMarkdown, safeParseMarkdown, stringifyMarkdown } from './frontmatter'
import type { ZodSchema } from 'zod'

const SAFE_ID_RE = /^[a-zA-Z0-9_-]+$/
const SAFE_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function validateId(id: string): string {
  if (!SAFE_ID_RE.test(id)) {
    throw new Error(`Invalid entity id: ${id}`)
  }
  return id
}

function validateDate(date: string): string {
  if (!SAFE_DATE_RE.test(date)) {
    throw new Error(`Invalid date format: ${date}`)
  }
  return date
}

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

function sanitizeData<T extends object>(data: T): T {
  const clean = {} as Record<string, unknown>
  for (const [key, value] of Object.entries(data)) {
    if (!DANGEROUS_KEYS.has(key)) {
      clean[key] = value
    }
  }
  return clean as T
}

async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true })
}

export async function listEntities<T>(
  folder: FolderKey,
  schema?: ZodSchema<T>
): Promise<Array<{ data: T; content: string; filename: string }>> {
  const dirPath = FOLDERS[folder]
  await ensureDir(dirPath)

  const files = await fs.readdir(dirPath)
  const mdFiles = files.filter(f => f.endsWith('.md'))

  const all = await Promise.all(
    mdFiles.map(async (filename) => {
      const raw = await fs.readFile(path.join(dirPath, filename), 'utf-8')
      if (schema) {
        const parsed = safeParseMarkdown<T>(raw, schema, filename)
        if (!parsed) return null // skip files that don't match schema
        return { ...parsed, filename }
      }
      const parsed = parseMarkdown<T>(raw)
      return { ...parsed, filename }
    })
  )

  return all.filter((r): r is NonNullable<typeof r> => r !== null)
}

export async function getEntity<T>(
  folder: FolderKey,
  id: string,
  schema?: ZodSchema<T>
): Promise<{ data: T; content: string } | null> {
  const safeId = validateId(id)
  const dirPath = FOLDERS[folder]
  const files = await fs.readdir(dirPath)
  const target = files.find(f => f.includes(`-${safeId}.`) && f.endsWith('.md'))

  if (!target) return null

  const raw = await fs.readFile(path.join(dirPath, target), 'utf-8')
  return parseMarkdown<T>(raw, schema)
}

export async function getEntityByDate<T>(
  folder: FolderKey,
  date: string,
  schema?: ZodSchema<T>
): Promise<{ data: T; content: string } | null> {
  const safeDate = validateDate(date)
  const dirPath = FOLDERS[folder]
  const filePath = path.join(dirPath, `${safeDate}.md`)

  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    return parseMarkdown<T>(raw, schema)
  } catch {
    return null
  }
}

export async function createEntity<T extends object>(
  folder: FolderKey,
  data: Omit<T, 'id'> & { id?: string },
  body?: string
): Promise<T> {
  const dirPath = FOLDERS[folder]
  await ensureDir(dirPath)

  const id = data.id || nanoid(10)
  const entityData = sanitizeData({ ...data, id }) as T
  const prefix = folder.replace(/s$/, '').replace(/Logs$/, '').replace(/Sessions$/, 'session')
  const filename = `${prefix}-${id}.md`
  const filePath = path.join(dirPath, filename)

  const content = stringifyMarkdown(entityData as object, body)
  await fs.writeFile(filePath, content, 'utf-8')

  return entityData
}

export async function createDateEntity<T extends object>(
  folder: FolderKey,
  date: string,
  data: T
): Promise<T> {
  const dirPath = FOLDERS[folder]
  await ensureDir(dirPath)

  const filePath = path.join(dirPath, `${date}.md`)
  const content = stringifyMarkdown(data as object)
  await fs.writeFile(filePath, content, 'utf-8')

  return data
}

export async function updateEntity<T extends object>(
  folder: FolderKey,
  id: string,
  updates: Partial<T>,
  body?: string
): Promise<T | null> {
  const safeId = validateId(id)
  const dirPath = FOLDERS[folder]
  const files = await fs.readdir(dirPath)
  const target = files.find(f => f.includes(`-${safeId}.`) && f.endsWith('.md'))

  if (!target) return null

  const filePath = path.join(dirPath, target)
  const raw = await fs.readFile(filePath, 'utf-8')
  const parsed = parseMarkdown<T>(raw)

  const updated = sanitizeData({ ...parsed.data, ...updates }) as T
  const newBody = body !== undefined ? body : parsed.content
  const content = stringifyMarkdown(updated as object, newBody)
  await fs.writeFile(filePath, content, 'utf-8')

  return updated
}

export async function updateDateEntity<T extends object>(
  folder: FolderKey,
  date: string,
  data: T
): Promise<T> {
  const dirPath = FOLDERS[folder]
  await ensureDir(dirPath)

  const filePath = path.join(dirPath, `${date}.md`)
  const content = stringifyMarkdown(data as object)
  await fs.writeFile(filePath, content, 'utf-8')

  return data
}

export async function deleteEntity(folder: FolderKey, id: string): Promise<boolean> {
  const safeId = validateId(id)
  const dirPath = FOLDERS[folder]
  const files = await fs.readdir(dirPath)
  const target = files.find(f => f.includes(`-${safeId}.`) && f.endsWith('.md'))

  if (!target) return false

  await fs.unlink(path.join(dirPath, target))
  return true
}

export async function getProfile<T>(schema?: ZodSchema<T>): Promise<{ data: T; content: string }> {
  const raw = await fs.readFile(PROFILE_PATH, 'utf-8')
  return parseMarkdown<T>(raw, schema)
}

export async function updateProfile<T extends object>(
  updates: Partial<T>
): Promise<T> {
  const raw = await fs.readFile(PROFILE_PATH, 'utf-8')
  const parsed = parseMarkdown<T>(raw)
  const updated = sanitizeData({ ...parsed.data, ...updates }) as T
  const content = stringifyMarkdown(updated as object, parsed.content)
  await fs.writeFile(PROFILE_PATH, content, 'utf-8')
  return updated
}
