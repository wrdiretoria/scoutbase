/**
 * GET /api/convite/listar
 * Treinador busca suas solicitações de avaliação pendentes.
 * Retorna array de { atletaId, atletaNome, atletaMcId, ts }
 */
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const m = user.user_metadata ?? {}
    const eTreinador =
      m.tipo === 'treinador' ||
      m.tipo === 'escola' ||
      (!m.posicao && !m.athlete_id && (m.clube_atual || m.especialidade || m.anos_exp || m.certificacoes || m.clubes_trabalhados))
    if (!eTreinador) {
      return NextResponse.json({ error: 'Apenas treinadores podem listar solicitações.' }, { status: 403 })
    }

    type Solicitacao = { atletaId: string; atletaNome: string; atletaMcId: string; ts: string }
    const solicitacoes: Solicitacao[] =
      (user.user_metadata?.solicitacoes as Solicitacao[]) ?? []

    return NextResponse.json({ solicitacoes })
  } catch (err) {
    console.error('[convite/listar]', err)
    return NextResponse.json({ error: 'Erro ao buscar solicitações.' }, { status: 500 })
  }
}
