import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { sendEmail, emailAvaliacaoRecebida } from '@/lib/email'
import { calcScoutScore, getTodasPerguntas, type VarianteKey } from '@/lib/questionnaire'

export async function POST(req: NextRequest) {
  // ── Autenticação ──
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  if (user.user_metadata?.tipo !== 'treinador') {
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

  // ── scout_score: média das 20 notas × 20 (resultado 20–100) ──
  const scout_score = calcScoutScore(respostas, variante)

  const admin = createAdminClient()

  // ── Verifica idade do atleta (bloqueia 18+) ──
  const { data: profileData } = await admin
    .from('profiles')
    .select('data_nascimento')
    .eq('id', profileId)
    .maybeSingle()

  if (profileData?.data_nascimento) {
    const nasc = new Date(profileData.data_nascimento)
    const hoje = new Date()
    const idade = hoje.getFullYear() - nasc.getFullYear() -
      (hoje < new Date(hoje.getFullYear(), nasc.getMonth(), nasc.getDate()) ? 1 : 0)
    if (idade >= 18) {
      return NextResponse.json({
        error: 'Este atleta já completou 18 anos. O Meu Craque é exclusivo para o futebol de base (sub-18). O histórico de avaliações anteriores permanece salvo.',
      }, { status: 403 })
    }
  }

  // ── Verifica e decrementa card do atleta ──
  const { data: { user: atletaUser } } = await admin.auth.admin.getUserById(profileId)
  const cardsDisponiveis = (atletaUser?.user_metadata?.cards_disponiveis as number) ?? 0
  if (cardsDisponiveis <= 0) {
    return NextResponse.json({ error: 'Atleta não possui card de avaliação disponível.' }, { status: 403 })
  }
  await admin.auth.admin.updateUserById(profileId, {
    user_metadata: { cards_disponiveis: cardsDisponiveis - 1 },
  })

  // ── Colunas legado (mantém compat com queries antigas) ──
  // Mapeia as novas notas (1-5) para a escala de 1-10 usada pelas colunas legadas
  const to10 = (k: string) => Math.round((respostas[k] ?? 3) * 2)   // 1-5 → 2-10

  const tecnica_val    = to10('pf_tecnico')
  const fisico_val     = Math.round((to10('pf_forte') + to10('cx_1')) / 2)
  const tatico_val     = Math.round((to10('pf_inteligente') + to10('tomada_decisao')) / 2)
  const comport_val    = Math.round((to10('pf_competitivo') + to10('pf_decisivo')) / 2)

  // Colunas individuais legadas
  const vel_val   = to10('cx_1')                          // cx_1 = velocidade na maioria das variantes
  const forca_val = to10('pf_forte')
  const fin_val   = to10('finalizacao')
  const visao_val = to10('tomada_decisao')
  const posic_val = to10('pf_inteligente')
  const tec_val   = to10('pf_tecnico')

  // ── Salva avaliação ──
  const respostasComVariante = { ...respostas, variante }

  const { error: dbError } = await admin.from('avaliacoes').insert({
    professor_id:    user.id,
    aluno_id:        profileId,
    // Colunas agrupadas legado
    tecnico:         tecnica_val,
    fisico:          fisico_val,
    tatico:          tatico_val,
    comportamento:   comport_val,
    scout_score,
    // Colunas individuais legado
    velocidade:      vel_val,
    forca:           forca_val,
    finalizacao:     fin_val,
    visao_jogo:      visao_val,
    posicionamento:  posic_val,
    tecnica:         tec_val,
    observacao:      observacao?.trim() || null,
    // Nova coluna JSONB com todas as 20 respostas + variante
    respostas:       respostasComVariante,
  })

  if (dbError) {
    console.error('[avaliar]', dbError)
    return NextResponse.json({ error: 'Erro ao registrar avaliação.' }, { status: 500 })
  }

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
