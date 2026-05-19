/**
 * POST /api/atleta/visita
 * Registra uma visita ao perfil público do atleta na tabela `visitas`.
 * Não requer autenticação — visitante pode ser scout sem login.
 * Body: { athleteUserId: string }   ← auth UUID (não o MC-ID)
 */
import { createAdminClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { athleteUserId } = await req.json() as { athleteUserId?: string }
    if (!athleteUserId) return NextResponse.json({ ok: false })

    const admin = createAdminClient()
    await admin.from('visitas').insert({ atleta_id: athleteUserId })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[visita]', err)
    // silencioso — visita nunca deve quebrar a página do atleta
    return NextResponse.json({ ok: false })
  }
}
