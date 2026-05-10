/**
 * POST /api/atleta/recuperar-id
 * Recebe { email } → retorna lista de athlete_ids vinculados a esse email de recuperação
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { email } = await req.json() as { email?: string }

  if (!email) {
    return NextResponse.json({ error: 'Email obrigatório.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('profiles')
    .select('athlete_id, nome')
    .eq('recovery_email', email.toLowerCase().trim())
    .not('athlete_id', 'is', null)

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar.' }, { status: 500 })
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Nenhum atleta encontrado com este email.' }, { status: 404 })
  }

  return NextResponse.json({ atletas: data })
}
