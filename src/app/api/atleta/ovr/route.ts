import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { fetchOvrSingle } from '@/lib/ovr'

/**
 * GET /api/atleta/ovr?athleteId=MC-XXXXX
 * Retorna { ovr: number | null } — público, sem auth.
 */
export async function GET(req: NextRequest) {
  const athleteId = req.nextUrl.searchParams.get('athleteId')
  if (!athleteId) return NextResponse.json({ ovr: null })

  const admin = createAdminClient()
  const ovr   = await fetchOvrSingle(admin, athleteId)
  return NextResponse.json({ ovr })
}
