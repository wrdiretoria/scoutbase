/**
 * POST /api/auth/reset-por-id
 * Recebe { athleteId, redirectTo } → envia reset de senha server-side sem expor o email
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { athleteId, redirectTo } = await req.json() as {
    athleteId?: string
    redirectTo?: string
  }

  if (!athleteId || !redirectTo) {
    return NextResponse.json({ error: 'Dados obrigatórios.' }, { status: 400 })
  }

  const prefix = athleteId.startsWith('TR-') ? 'TR' : 'MC'
  const idFormatado = `${prefix}-${athleteId.replace(/\D/g, '').padStart(5, '0')}`

  if (!/^(MC|TR)-\d{5}$/.test(idFormatado)) {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .select('email')
    .eq('athlete_id', idFormatado)
    .single()

  // Resposta idêntica se não encontrar — evita enumeração
  if (error || !data?.email) {
    return NextResponse.json({ ok: true })
  }

  const supabase = await createServerClient()
  await supabase.auth.resetPasswordForEmail(data.email, { redirectTo })

  return NextResponse.json({ ok: true })
}
