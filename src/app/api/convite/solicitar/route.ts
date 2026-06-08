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

    const raw = treinadorMcId.trim().toUpperCase()

    // Admin declarado aqui para bypassar RLS em todas as queries seguintes
    const admin = createAdminClient()

    // Monta candidatos de athlete_id: aceita "00001", "TR-00001", "MC-00001" etc.
    const candidatos = Array.from(new Set([
      raw,
      raw.startsWith('TR-') ? raw : `TR-${raw}`,
      raw.startsWith('MC-') ? raw : `MC-${raw}`,
    ]))

    // Busca o treinador pelo athlete_id (tenta todos os formatos)
    let treinadorProfile: { id: string; nome: string } | null = null
    for (const id of candidatos) {
      const { data } = await admin
        .from('profiles')
        .select('id, nome')
        .eq('athlete_id', id)
        .maybeSingle()
      if (data) { treinadorProfile = data as { id: string; nome: string }; break }
    }

    if (!treinadorProfile) {
      return NextResponse.json({ error: 'Treinador não encontrado. Verifique o ID.' }, { status: 404 })
    }

    const treinadorId = treinadorProfile.id as string

    // Verifica se é de fato um treinador (tipo='treinador'|'escola' OU campos de treinador preenchidos)
    const { data: { user: treinadorUser } } = await admin.auth.admin.getUserById(treinadorId)
    if (!treinadorUser) {
      return NextResponse.json({ error: 'Treinador não encontrado.' }, { status: 404 })
    }
    const tm = treinadorUser.user_metadata ?? {}
    const eTreinador =
      tm.tipo === 'treinador' ||
      tm.tipo === 'escola' ||
      (!tm.posicao && !tm.athlete_id && (tm.clube_atual || tm.especialidade || tm.anos_exp || tm.certificacoes || tm.clubes_trabalhados))
    if (!eTreinador) {
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
