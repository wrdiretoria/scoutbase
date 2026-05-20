/**
 * POST /api/convite/solicitar
 * Atleta envia solicitação de avaliação para um treinador pelo ID dele (MC-XXXXX).
 * Armazena na user_metadata do treinador: { solicitacoes: [...] }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    if (user.user_metadata?.tipo !== 'atleta') {
      return NextResponse.json({ error: 'Apenas atletas podem enviar solicitações.' }, { status: 403 })
    }

    // Verifica se é a primeira avaliação (gratuita) ou se tem card
    const cardsDisponiveis = (user.user_metadata?.cards_disponiveis as number) ?? 0
    const { count: evalCount } = await supabase
      .from('avaliacoes')
      .select('*', { count: 'exact', head: true })
      .eq('aluno_id', user.id)
    const primeiraAvaliacao = (evalCount ?? 0) === 0
    if (!primeiraAvaliacao && cardsDisponiveis <= 0) {
      return NextResponse.json({ error: 'Você não possui card de avaliação disponível.' }, { status: 403 })
    }

    const { treinadorMcId } = await req.json() as { treinadorMcId?: string }
    if (!treinadorMcId?.trim()) {
      return NextResponse.json({ error: 'ID do treinador é obrigatório.' }, { status: 400 })
    }

    const mcId = treinadorMcId.trim().toUpperCase()

    // Busca o treinador pelo athlete_id na tabela profiles (admin bypassa RLS)
    const { data: treinadorProfile } = await admin
      .from('profiles')
      .select('id, nome')
      .eq('athlete_id', mcId)
      .single()

    if (!treinadorProfile) {
      return NextResponse.json({ error: 'Treinador não encontrado. Verifique o ID.' }, { status: 404 })
    }

    const treinadorId = treinadorProfile.id as string

    // Verifica se o treinador existe e é de fato um treinador
    const admin = createAdminClient()
    const { data: { user: treinadorUser } } = await admin.auth.admin.getUserById(treinadorId)
    if (!treinadorUser || treinadorUser.user_metadata?.tipo !== 'treinador') {
      return NextResponse.json({ error: 'ID não pertence a um treinador.' }, { status: 404 })
    }

    // Verifica se o atleta já enviou solicitação para este treinador (sem duplicar)
    const atletaNome = (user.user_metadata?.nome as string) ?? 'Atleta'

    const { data: atletaProfile } = await supabase
      .from('profiles')
      .select('athlete_id')
      .eq('id', user.id)
      .single()

    const atletaMcId = (atletaProfile?.athlete_id as string) ?? ''

    type Solicitacao = { atletaId: string; atletaNome: string; atletaMcId: string; ts: string }
    const solicitacoesAtuais: Solicitacao[] =
      (treinadorUser.user_metadata?.solicitacoes as Solicitacao[]) ?? []

    // Impede duplicata
    const jaSolicitou = solicitacoesAtuais.some(s => s.atletaId === user.id)
    if (jaSolicitou) {
      return NextResponse.json({ ok: true, ja_enviado: true })
    }

    const nova: Solicitacao = {
      atletaId:   user.id,
      atletaNome,
      atletaMcId,
      ts:         new Date().toISOString(),
    }

    await admin.auth.admin.updateUserById(treinadorId, {
      user_metadata: {
        solicitacoes: [...solicitacoesAtuais, nova],
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[convite/solicitar]', err)
    return NextResponse.json({ error: 'Erro ao enviar solicitação.' }, { status: 500 })
  }
}
