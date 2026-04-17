import { NextResponse } from 'next/server'
import { safeJson, serverError } from '@/lib/safeJson'
import { getProfile, updateProfile } from '@/lib/vault'
import { profileSchema } from '@/lib/vault/schemas'
import type { Profile } from '@/types'

export async function GET() {
  // Return full profile without schema filtering (allows saju_motto etc.)
  const result = await getProfile()
  return NextResponse.json(result.data)
}

export async function PUT(request: Request) {
  const [body, _err] = await safeJson(request); if (_err) return _err
  const updates = { ...body, updated_at: new Date().toISOString() }
  const result = await updateProfile<Profile>(updates)
  return NextResponse.json(result)
}
