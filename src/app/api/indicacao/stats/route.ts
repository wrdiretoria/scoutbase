/**
 * GET /api/indicacao/stats
 * Progresso da indicação premiada do atleta logado: X/3 amigos para a próxima
 * avaliação grátis (contando só indicações confirmadas na tabela indicacoes).
 */
import { NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { AMIGOS_POR_PREMIO, progressoIndicacoes } from '@/lib/indicacao'

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const p = await progressoIndicacoes(createAdminClient(), user.id)
    return NextResponse.json({
      count:   p.confirmadas,   // total confirmado (compat.)
      noLote:  p.noLote,        // 0..2 → "X/3"
      meta:    AMIGOS_POR_PREMIO,
      faltam:  p.faltam,
      premios: p.premios,       // avaliações grátis já ganhas por indicação
      pendentes: p.pendentes,   // cadastros completos aguardando avaliação oficial
    })
  } catch (err) {
    console.error('[indicacao/stats] unexpected', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

