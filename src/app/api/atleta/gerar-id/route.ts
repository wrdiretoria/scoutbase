/**
 * POST /api/atleta/gerar-id
 * Gera um MC-XXXXX único sem salvar ainda — usado antes do signUp
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST() {
  const admin = createAdminClient()

  for (let tentativa = 0; tentativa < 10; tentativa++) {
    const num = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
    const id = `MC-${num}`
    const { data } = await admin.from('profiles').select('id').eq('athlete_id', id).maybeSingle()
    if (!data) return NextResponse.json({ athleteId: id })
  }

  // fallback: tenta mais 5 vezes com número aleatório maior para evitar colisão
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const num = Math.floor(Math.random() * 900000 + 100000).toString().slice(0, 5)
    const id = `MC-${num}`
    const { data } = await admin.from('profiles').select('id').eq('athlete_id', id).maybeSingle()
    if (!data) return NextResponse.json({ athleteId: id })
  }

  return NextResponse.json({ error: 'Não foi possível gerar ID único. Tente novamente.' }, { status: 503 })
}
