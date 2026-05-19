import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { sendEmail, emailAvaliacaoRecebida } from '@/lib/email'

export async function POST(req: NextRequest) {
  // ── Autenticação ──
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  // Apenas treinadores podem avaliar
  if (user.user_metadata?.tipo !== 'treinador') {
    return NextResponse.json({ error: 'Acesso restrito a treinadores.' }, { status: 403 })
  }

  // ── Parse body (valores 10–100) ──
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

  // ── Validação ──
  const atributos = [velocidade, visao, forca, finalizacao, inteligenciaTatica, tecnica]
  if (atributos.some(n => !n || n < 10 || n > 100)) {
    return NextResponse.json({ error: 'Todos os atributos precisam ser avaliados.' }, { status: 400 })
  }

  // ── Mapear para colunas reais do banco (1–10) ──
  const toScale = (n: number) => Math.round(n / 10)          // 10–100 → 1–10

  const tecnico_val      = toScale(tecnica)
  const fisico_val       = Math.round((velocidade + forca) / 2 / 10)
  const tatico_val       = Math.round((visao + inteligenciaTatica) / 2 / 10)
  const comportamento_val = toScale(finalizacao)

  // scout_score = média dos 4 principais × 10 (0–100)
  const scout_score = Math.round(
    (tecnico_val + fisico_val + tatico_val + comportamento_val) / 4 * 10
  )

  // ── Verifica e decrementa card do atleta ──
  const admin = createAdminClient()
  const { data: { user: atletaUser } } = await admin.auth.admin.getUserById(profileId)

  // Bloqueia avaliação se atleta já completou 18 anos
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

  const cardsDisponiveis = (atletaUser?.user_metadata?.cards_disponiveis as number) ?? 0
  if (cardsDisponiveis <= 0) {
    return NextResponse.json({ error: 'Atleta não possui card de avaliação disponível.' }, { status: 403 })
  }
  await admin.auth.admin.updateUserById(profileId, {
    user_metadata: { cards_disponiveis: cardsDisponiveis - 1 },
  })

  // ── Salvar ──
  const { error } = await admin.from('avaliacoes').insert({
    professor_id:    user.id,
    aluno_id:        profileId,
    // Colunas agrupadas (legado ScoutBase)
    tecnico:         tecnico_val,
    fisico:          fisico_val,
    tatico:          tatico_val,
    comportamento:   comportamento_val,
    scout_score,
    // Sub-colunas individuais (usadas pelo perfil Meu Craque)
    velocidade:      toScale(velocidade),
    forca:           toScale(forca),
    finalizacao:     toScale(finalizacao),
    visao_jogo:      toScale(visao),
    posicionamento:  toScale(inteligenciaTatica),
    tecnica:         tecnico_val,  // mesmo valor de tecnico, coluna individual
    observacao:      observacao?.trim() || null,
  })

  if (error) {
    console.error('[avaliar]', error)
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

  // ── Email de notificação (não bloqueia resposta) ──
  try {
    if (atletaUser?.email) {
      const atletaMeta = atletaUser.user_metadata as { nome?: string }
      const treinadorMeta = user.user_metadata as { nome?: string }
      const html = emailAvaliacaoRecebida({
        atletaNome:    atletaMeta.nome     ?? 'Atleta',
        atletaEmail:   atletaUser.email,
        treinadorNome: treinadorMeta.nome  ?? user.email ?? 'Treinador',
        notaGeral:     scout_score,
        velocidade:    toScale(velocidade),
        forca:         toScale(forca),
        finalizacao:   toScale(finalizacao),
        visao:         toScale(visao),
        posicionamento:toScale(inteligenciaTatica),
        tecnica:       tecnico_val,
        observacao:    observacao?.trim() || null,
        atletaId:      profileId,
      })
      await sendEmail({
        to:      atletaUser.email,
        subject: `🏆 Você recebeu uma avaliação oficial no Meu Craque! (OVR ${scout_score})`,
        html,
      })
    }
  } catch (emailErr) {
    // Email nunca deve quebrar a avaliação
    console.error('[avaliar] email falhou:', emailErr)
  }

  return NextResponse.json({ ok: true, notaGeral: scout_score })
}
