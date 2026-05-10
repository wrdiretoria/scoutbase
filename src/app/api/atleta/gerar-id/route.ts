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

  // fallback com timestamp
  return NextResponse.json({ athleteId: `MC-${Date.now().toString().slice(-5)}` })
}
