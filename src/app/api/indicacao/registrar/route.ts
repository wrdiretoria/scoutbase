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

    // 4. Incrementa contador do referenciador e dá card a cada 10 indicações
    const { data: { user: referrer } } = await admin.auth.admin.getUserById(referrerId)
    const totalIndicacoes = ((referrer?.user_metadata?.indicacoes_count as number) ?? 0) + 1

    const novosMeta: Record<string, unknown> = { indicacoes_count: totalIndicacoes }

    // A cada 10 indicações exatas → 1 card grátis
    if (totalIndicacoes % 10 === 0) {
      const cardsAtuais = (referrer?.user_metadata?.cards_disponiveis as number) ?? 0
      novosMeta.cards_disponiveis = cardsAtuais + 1
      console.log(`[indicacao] 🎉 Atleta ${referrerId} atingiu ${totalIndicacoes} indicações → +1 card`)
    }

    await admin.auth.admin.updateUserById(referrerId, { user_metadata: novosMeta })

    return NextResponse.json({
      ok: true,
      referrerId,
      totalIndicacoes,
      cardBrinde: totalIndicacoes % 10 === 0,
    })
  } catch (err) {
    console.error('[indicacao/registrar] unexpected', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
