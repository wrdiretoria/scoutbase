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

  // Keys específicas por variante — velocidade, finalização e visão de jogo
  // (pf_tecnico, pf_forte, pf_inteligente, pf_competitivo, pf_decisivo são universais — Bloco B)
  const VEL_KEY: Record<VarianteKey, string> = {
    iniciacao:               'cx_1',
    iniciacao_goleiro:       'gk_velocidade_reacao',
    iniciacao_zagueiro:      'zag_resistencia',
    iniciacao_lateral:       'lat_velocidade',
    iniciacao_volante:       'vol_resistencia',
    iniciacao_meia:          'mei_velocidade_reacao',
    iniciacao_ponta:         'pon_velocidade',
    iniciacao_centroavante:  'cav_velocidade_reacao',
    formacao_goleiro:        'gk_velocidade_reacao',
    formacao_zagueiro:       'zag_resistencia',
    formacao_lateral:        'lat_velocidade',
    formacao_volante:        'vol_velocidade_reacao',
    formacao_meia:           'mei_velocidade',
    formacao_ponta:          'pon_velocidade_sprint',
    formacao_centroavante:   'cav_velocidade',
    competicao_goleiro:      'gk_velocidade_reacao',
    competicao_zagueiro:     'zag_resistencia',
    competicao_lateral:      'lat_velocidade_aceleracao',
    competicao_volante:      'vol_velocidade_aceleracao',
    competicao_meia:         'mei_velocidade_aceleracao',
    competicao_ponta:        'pon_velocidade_aceleracao',
    competicao_centroavante: 'cav_velocidade_aceleracao',
  }

  const FIN_KEY: Record<VarianteKey, string> = {
    iniciacao:               'finalizacao',
    iniciacao_goleiro:       'gk_distribuicao_pes',
    iniciacao_zagueiro:      'zag_passe_curto',
    iniciacao_lateral:       'lat_cruzamento',
    iniciacao_volante:       'vol_passe_curto',
    iniciacao_meia:          'mei_finalizacao',
    iniciacao_ponta:         'pon_finalizacao',
    iniciacao_centroavante:  'cav_finalizacao',
    formacao_goleiro:        'gk_passe_curto_pes',
    formacao_zagueiro:       'zag_saida_bola',
    formacao_lateral:        'lat_cruzamento',
    formacao_volante:        'vol_passe_curto_medio',
    formacao_meia:           'mei_finalizacao',
    formacao_ponta:          'pon_finalizacao',
    formacao_centroavante:   'cav_finalizacao_precisao',
    competicao_goleiro:      'gk_jogo_pes_curto_medio',
    competicao_zagueiro:     'zag_saida_qualidade',
    competicao_lateral:      'lat_cruzamento_qualidade',
    competicao_volante:      'vol_finalizacao_media',
    competicao_meia:         'mei_finalizacao_pressao',
    competicao_ponta:        'pon_finalizacao_pressao',
    competicao_centroavante: 'cav_finalizacao_pressao',
  }

  const VIS_KEY: Record<VarianteKey, string> = {
    iniciacao:               'tomada_decisao',
    iniciacao_goleiro:       'gk_atencao_foco',
    iniciacao_zagueiro:      'zag_antecipacao',
    iniciacao_lateral:       'lat_antecipacao',
    iniciacao_volante:       'vol_visao',
    iniciacao_meia:          'mei_visao',
    iniciacao_ponta:         'pon_leitura_espaco',
    iniciacao_centroavante:  'cav_posicionamento',
    formacao_goleiro:        'gk_leitura_antecipada',
    formacao_zagueiro:       'zag_interceptacao',
    formacao_lateral:        'lat_antecipacao',
    formacao_volante:        'vol_leitura_jogo',
    formacao_meia:           'mei_visao_circulacao',
    formacao_ponta:          'pon_leitura_jogo',
    formacao_centroavante:   'cav_leitura_jogo',
    competicao_goleiro:      'gk_tomada_decisao_pressao',
    competicao_zagueiro:     'zag_antecipacao_tatica',
    competicao_lateral:      'lat_leitura_jogo',
    competicao_volante:      'vol_posicionamento',
    competicao_meia:         'mei_visao_decisao',
    competicao_ponta:        'pon_tomada_decisao',
    competicao_centroavante: 'cav_leitura_defesa',
  }

  const tecnica_val = to10('pf_tecnico')
  const fisico_val  = Math.round((to10('pf_forte') + to10(VEL_KEY[variante])) / 2)
  const tatico_val  = Math.round((to10('pf_inteligente') + to10(VIS_KEY[variante])) / 2)
  const comport_val = Math.round((to10('pf_competitivo') + to10('pf_decisivo')) / 2)

  // Colunas individuais legadas
  const vel_val   = to10(VEL_KEY[variante])
  const forca_val = to10('pf_forte')
  const fin_val   = to10(FIN_KEY[variante])
  const visao_val = to10(VIS_KEY[variante])
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
