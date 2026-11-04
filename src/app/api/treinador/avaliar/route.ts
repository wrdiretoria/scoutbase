import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { confirmarIndicacaoAposAvaliacao } from '@/lib/indicacao'
import { isVerifiedTrainer } from '@/lib/trainer-access'
import { sendEmail, emailAvaliacaoRecebida } from '@/lib/email'
import { calcScoutScore, calcAtributos, getTodasPerguntas, type VarianteKey } from '@/lib/questionnaire'

export async function POST(req: NextRequest) {
  // ── Autenticação ──
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  if (!await isVerifiedTrainer(user.id)) {
    return NextResponse.json({ error: 'Acesso restrito a treinadores.' }, { status: 403 })
  }

  // ── Parse body ──
  const { profileId, respostas, variante, observacao } = await req.json() as {
    profileId:  string
    respostas:  Record<string, number>
    variante:   VarianteKey
    observacao: string
  }

  if (!profileId || !respostas || !variante) {
    return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
  }

  // ── Valida as 20 respostas ──
  const perguntas = getTodasPerguntas(variante)
  if (perguntas.length !== 20) {
    return NextResponse.json({ error: 'Variante de questionário inválida.' }, { status: 400 })
  }

  for (const q of perguntas) {
    const v = respostas[q.key]
    if (!v || v < 1 || v > 5 || !Number.isInteger(v)) {
      return NextResponse.json(
        { error: `Resposta inválida para "${q.label}". Use escala 1–5.` },
        { status: 400 },
      )
    }
  }

  // ── scout_score: média ponderada por bloco (Técnico 35% · Físico 25% · Tático 25% · Comportamento 15%) ──
  const scout_score = calcScoutScore(respostas, variante)

  const admin = createAdminClient()

  // ── Verifica idade do atleta (bloqueia 18+) ──
  const { data: profileData } = await admin
    .from('profiles')
    .select('data_nascimento, cards_disponiveis')
    .eq('id', profileId)
    .maybeSingle()

  if (profileData?.data_nascimento) {
    const nasc = new Date(profileData.data_nascimento)
    const hoje = new Date()
    const idade = hoje.getFullYear() - nasc.getFullYear() -
      (hoje < new Date(hoje.getFullYear(), nasc.getMonth(), nasc.getDate()) ? 1 : 0)
    if (idade > 20) {
      return NextResponse.json({
        error: 'Este atleta já completou 20 anos. O Meu Craque é exclusivo para o futebol de base (até Sub-20). O histórico de avaliações anteriores permanece salvo.',
      }, { status: 403 })
    }
  }

  // ── Verifica e decrementa card do atleta ──
  const { data: { user: atletaUser } } = await admin.auth.admin.getUserById(profileId)
  const cardsDisponiveis = profileData?.cards_disponiveis ?? 0

  // Primeira avaliação é gratuita — verifica se nunca foi avaliado antes
  const { count: avaliacoesAnteriores } = await admin
    .from('avaliacoes')
    .select('*', { count: 'exact', head: true })
    .eq('aluno_id', profileId)
  let primeiraAvaliacao = false
  if ((avaliacoesAnteriores ?? 0) === 0) {
    const { data: claimedFreeEvaluation, error: claimError } = await admin.rpc('claim_first_free_evaluation', {
      p_user_id: profileId,
    })
    if (claimError) {
      console.error('[avaliar] free evaluation claim failed', claimError)
      return NextResponse.json({ error: 'Não foi possível reservar a avaliação gratuita.' }, { status: 500 })
    }
    primeiraAvaliacao = claimedFreeEvaluation === true
    if (!primeiraAvaliacao) {
      const { count: latestAssessmentCount } = await admin
        .from('avaliacoes')
        .select('*', { count: 'exact', head: true })
        .eq('aluno_id', profileId)
      if ((latestAssessmentCount ?? 0) === 0) {
        return NextResponse.json({ error: 'Já existe uma avaliação em andamento para este atleta. Tente novamente em instantes.' }, { status: 409 })
      }
    }
  }

  if (!primeiraAvaliacao && cardsDisponiveis <= 0) {
    return NextResponse.json({ error: 'Atleta não possui card de avaliação disponível.' }, { status: 403 })
  }

  // Só decrementa card se não for a primeira avaliação (a primeira é grátis)
  const debitado = !primeiraAvaliacao && cardsDisponiveis > 0
  if (debitado) {
    const { data: saldoRestante, error: debitError } = await admin.rpc('decrement_card', {
      p_user_id: profileId,
    })
    if (debitError || saldoRestante === null) {
      return NextResponse.json({ error: 'Atleta não possui card de avaliação disponível.' }, { status: 403 })
    }
  }

  // ── Calcula os 6 atributos FIFA-style via calcAtributos ──
  // posicao está em user_metadata (não na tabela profiles)
  const posicaoAtleta = (atletaUser?.user_metadata?.posicao as string | null) ?? 'Atacante'
  const atrs = calcAtributos(respostas, posicaoAtleta)

  // Mapeia VEL/TEC/DRI/FIS/TAT/POS para as colunas legadas do DB
  // (reutilizamos as colunas existentes com os novos valores 0-99)
  const vel_val   = atrs.VEL
  const tec_val   = atrs.TEC
  const fin_val   = atrs.DRI   // coluna finalizacao → DRI
  const forca_val = atrs.FIS   // coluna forca → FIS
  const visao_val = atrs.TAT   // coluna visao_jogo → TAT
  const posic_val = atrs.POS   // coluna posicionamento → POS

  // Agrupados para compatibilidade
  const tecnica_val = atrs.TEC
  const fisico_val  = atrs.FIS
  const tatico_val  = atrs.TAT
  const comport_val = atrs.POS

  // ── Salva avaliação ──
  const { error: dbError } = await admin.from('avaliacoes').insert({
    professor_id:    user.id,
    aluno_id:        profileId,
    // Colunas agrupadas
    tecnico:         tecnica_val,
    fisico:          fisico_val,
    tatico:          tatico_val,
    comportamento:   comport_val,
    scout_score,
    // Colunas individuais
    velocidade:      vel_val,
    forca:           forca_val,
    finalizacao:     fin_val,
    visao_jogo:      visao_val,
    posicionamento:  posic_val,
    tecnica:         tec_val,
    observacao:      observacao?.trim() || null,
    respostas:       respostas ?? null,
    variante:        variante  ?? null,
  })

  if (dbError) {
    if (primeiraAvaliacao) {
      const { error: claimReleaseError } = await admin.rpc('release_first_free_evaluation', {
        p_user_id: profileId,
      })
      if (claimReleaseError) console.error('[avaliar] free evaluation claim release failed', claimReleaseError)
    }
    if (debitado) {
      const { error: refundError } = await admin.rpc('grant_evaluation_credit', {
        p_user_id: profileId,
        p_source_key: `assessment-refund:${randomUUID()}`,
        p_amount: 1,
      })
      if (refundError) console.error('[avaliar] credit refund failed', refundError)
    }
    console.error('[avaliar]', dbError)
    return NextResponse.json({ error: 'Erro ao registrar avaliação.' }, { status: 500 })
  }

  // A primeira avaliação oficial de um treinador aprovado verifica o atleta indicado.
  await confirmarIndicacaoAposAvaliacao(admin, profileId, user.id)

  // ── Remove solicitação do treinador (se existia) ──
  try {
    type Solicitacao = { atletaId: string; atletaNome: string; atletaMcId: string; ts: string }
    const solicitacoesAtuais: Solicitacao[] =
      (user.user_metadata?.solicitacoes as Solicitacao[]) ?? []
    const solicitacoesRestantes = solicitacoesAtuais.filter(s => s.atletaId !== profileId)
    if (solicitacoesRestantes.length !== solicitacoesAtuais.length) {
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: { solicitacoes: solicitacoesRestantes },
      })
    }
  } catch { /* ignorar */ }

  // ── Email de notificação ──
  try {
    if (atletaUser?.email) {
      const atletaMeta   = atletaUser.user_metadata as { nome?: string }
      const treinadorMeta = user.user_metadata as { nome?: string }
      const html = emailAvaliacaoRecebida({
        atletaNome:     atletaMeta.nome    ?? 'Atleta',
        atletaEmail:    atletaUser.email,
        treinadorNome:  treinadorMeta.nome ?? user.email ?? 'Treinador',
        notaGeral:      scout_score,
        velocidade:     vel_val,
        forca:          forca_val,
        finalizacao:    fin_val,
        visao:          visao_val,
        posicionamento: posic_val,
        tecnica:        tec_val,
        observacao:     observacao?.trim() || null,
        atletaId:       profileId,
      })
      await sendEmail({
        to:      atletaUser.email,
        subject: `🏆 Você recebeu uma avaliação oficial no Meu Craque! (OVR ${scout_score})`,
        html,
      })
    }
  } catch (emailErr) {
    console.error('[avaliar] email falhou:', emailErr)
  }

  return NextResponse.json({ ok: true, notaGeral: scout_score })
}

