import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  // ── Autenticação ──
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  // ── Parse body ──
  const {
    profileId,
    velocidade,
    visao,
    forca,
    finalizacao,
    inteligenciaTatica,
    tecnica,
    observacao,
  } = await req.json() as {
    profileId:          string
    velocidade:         number
    visao:              number
    forca:              number
    finalizacao:        number
    inteligenciaTatica: number
    tecnica:            number
    observacao:         string
  }

  // ── Validação básica ──
  const atributos = [velocidade, visao, forca, finalizacao, inteligenciaTatica, tecnica]
  if (atributos.some(n => !n || n < 10 || n > 100)) {
    return NextResponse.json({ error: 'Todos os atributos precisam ser avaliados.' }, { status: 400 })
  }

  // ── nota_geral = média dos 6 atributos (0–100), representa 0–50 no OVR ──
  const notaGeral = Math.round(atributos.reduce((a, b) => a + b, 0) / atributos.length)

  // ── Salvar avaliação ──
  const admin = createAdminClient()
  const { error } = await admin.from('avaliacoes').insert({
    treinador_id:       user.id,
    profile_id:         profileId,
    velocidade,
    visao,
    forca,
    finalizacao,
    inteligencia_tatica: inteligenciaTatica,
    tecnica,
    nota_geral:         notaGeral,
    observacao:         observacao?.trim() || null,
  })

  if (error) {
    console.error('Erro ao salvar avaliação:', error)
    return NextResponse.json({ error: 'Erro ao registrar avaliação.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, notaGeral })
}
