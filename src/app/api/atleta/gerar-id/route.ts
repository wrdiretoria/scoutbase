/**
 * POST /api/atleta/gerar-id
 * Gera um MC-XXXXX único sem salvar ainda — usado antes do signUp
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// Verifica se o número já está em uso por QUALQUER usuário (atleta ou treinador)
async function numeroEmUso(admin: ReturnType<typeof createAdminClient>, num: string): Promise<boolean> {
  const { data } = await admin
    .from('profiles')
    .select('id')
    .or(`athlete_id.eq.MC-${num},athlete_id.eq.TR-${num}`)
    .limit(1)
    .maybeSingle()
  return !!data
}

export async function POST() {
  const admin = createAdminClient()

  for (let tentativa = 0; tentativa < 15; tentativa++) {
    const num = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
    if (!(await numeroEmUso(admin, num))) {
      return NextResponse.json({ athleteId: `MC-${num}` })
    }
  }

  return NextResponse.json({ error: 'Não foi possível gerar ID único. Tente novamente.' }, { status: 503 })
}
