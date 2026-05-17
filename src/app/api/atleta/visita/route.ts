/**
 * POST /api/atleta/visita
 * Incrementa visit_count via user_metadata — zero alterações de schema.
 * Body: { athleteUserId: string }   ← auth UUID (não o MC-ID)
 */
import { createAdminClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { athleteUserId } = await req.json() as { athleteUserId?: string }
    if (!athleteUserId) {
      return NextResponse.json({ error: 'athleteUserId obrigatório' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Lê o valor atual do user_metadata
    const { data: { user }, error } = await admin.auth.admin.getUserById(athleteUserId)
    if (error || !user) {
      return NextResponse.json({ error: 'Atleta não encontrado' }, { status: 404 })
    }

    const current = (user.user_metadata?.visit_count as number | null) ?? 0

    // Incrementa — updateUserById faz merge, não substitui o metadata inteiro
    await admin.auth.admin.updateUserById(athleteUserId, {
      user_metadata: { visit_count: current + 1 },
    })

    return NextResponse.json({ ok: true, visit_count: current + 1 })
  } catch (err) {
    console.error('[visita]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
