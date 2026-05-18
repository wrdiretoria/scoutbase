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

    if (user.user_metadata?.tipo !== 'treinador') {
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
