/**
 * POST /api/auth/buscar-por-id
 * Recebe { athleteId } → devolve { email } para login por ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { athleteId } = await req.json() as { athleteId?: string }

  if (!athleteId) {
    return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('profiles')
    .select('email')
    .eq('athlete_id', athleteId.toUpperCase().trim())
    .single()

  if (error || !data?.email) {
    return NextResponse.json({ error: 'ID não encontrado.' }, { status: 404 })
  }

  return NextResponse.json({ email: data.email })
}
