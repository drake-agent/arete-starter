import { NextResponse } from 'next/server'
import { getProfile, updateProfile } from '@/lib/vault'
import { profileSchema } from '@/lib/vault/schemas'
import type { Profile } from '@/types'

export async function GET() {
  // Return full profile without schema filtering (allows custom fields)
  const result = await getProfile()
  return NextResponse.json(result.data)
}

export async function PUT(request: Request) {
  const body = await request.json()
  const updates = { ...body, updated_at: new Date().toISOString() }
  const result = await updateProfile<Profile>(updates)
  return NextResponse.json(result)
}
