/**
 * POST /api/indicacao/registrar
 * Registra que newUserId foi indicado pelo atleta com athleteId = refCode.
 * Chamado durante o cadastro quando ?ref=MC-XXXXX está na URL.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { refCode, newUserId } = await req.json() as { refCode?: string; newUserId?: string }

    if (!refCode || !newUserId) {
      return NextResponse.json({ error: 'refCode e newUserId obrigatórios' }, { status: 400 })
    }

    const admin = createAdminClient()

    // 1. Encontra o usuário dono do refCode (athleteId)
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('athlete_id', refCode.toUpperCase())
      .maybeSingle()

    if (!profile) {
      // Código inválido — não bloqueia o cadastro, só ignora
      return NextResponse.json({ ok: false, reason: 'refCode not found' })
    }

    const referrerId = profile.id

    // 2. Não se auto-indicar
    if (referrerId === newUserId) {
      return NextResponse.json({ ok: false, reason: 'self-referral' })
    }

    // 3. Salva referred_by no metadata do novo usuário
    const { error } = await admin.auth.admin.updateUserById(newUserId, {
      user_metadata: { referred_by: referrerId },
    })

    if (error) {
      console.error('[indicacao/registrar]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, referrerId })
  } catch (err) {
    console.error('[indicacao/registrar] unexpected', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
