/**
 * Indicação premiada — "3 amigos verificados = 1 avaliação grátis".
 * SÓ servidor (admin client). Tabela: indicacoes (scripts/migration-indicacoes.sql).
 *
 * Fluxo: o link /convite/[id] leva ao cadastro com ?ref=MC-XXXXX; ao salvar o
 * perfil completo (/api/atleta/salvar-perfil), a indicação fica pendente e só é
 * confirmada após a primeira avaliação oficial por treinador aprovado. A cada
 * 3 confirmadas → +1 crédito protegido no banco.
 *
 * Antifraude:
 *   • referred_id único — a mesma pessoa nunca conta duas vezes
 *   • autoindicação: mesmo id, mesmo e-mail de recuperação ou mesmo telefone
 *   • só contas novas (criadas há menos de 24h) — conta antiga não "vira" indicada
 *   • cadastro completo: nome, posição e data de nascimento
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export const AMIGOS_POR_PREMIO = 3
const JANELA_CONTA_NOVA_MS = 24 * 60 * 60 * 1000

const soDigitos = (s: unknown) => (typeof s === 'string' ? s.replace(/\D/g, '') : '')
const emailNorm = (s: unknown) => (typeof s === 'string' ? s.trim().toLowerCase() : '')

/** Normaliza o código do link: "92601", "mc-92601" → "MC-92601". */
export function normalizarCodigo(codigo: string | null | undefined): string | null {
  const m = (codigo ?? '').trim().toUpperCase().match(/^(?:MC-)?(\d{3,10})$/)
  return m ? `MC-${m[1]}` : null
}

export type ResultadoIndicacao =
  | { ok: true; referrerId: string; pendente: true }
  | { ok: false; motivo: string }

/**
 * Confirma a indicação do atleta `referredId` (o usuário logado que acabou de
 * completar o cadastro) pelo código `refCode`. Nunca lança — falha não pode
 * bloquear o cadastro.
 */
export async function confirmarIndicacao(
  admin: SupabaseClient,
  refCode: string | null | undefined,
  referredId: string,
): Promise<ResultadoIndicacao> {
  try {
    const codigo = normalizarCodigo(refCode)
    if (!codigo) return { ok: false, motivo: 'codigo_invalido' }

    const [{ data: referrerProfile }, { data: referredProfile }, { data: refUserRes }, { data: jaExiste }] = await Promise.all([
      admin.from('profiles').select('id, recovery_email').eq('athlete_id', codigo).maybeSingle(),
      admin.from('profiles').select('nome, data_nascimento, recovery_email').eq('id', referredId).maybeSingle(),
      admin.auth.admin.getUserById(referredId),
      admin.from('indicacoes').select('id').eq('referred_id', referredId).maybeSingle(),
    ])

    if (!referrerProfile?.id) return { ok: false, motivo: 'indicador_nao_encontrado' }
    if (jaExiste) return { ok: false, motivo: 'ja_registrada' }   // mesma pessoa não conta duas vezes
    const referrerId = referrerProfile.id as string

    const referredUser = refUserRes?.user
    const metaIndicado = (referredUser?.user_metadata ?? {}) as Record<string, unknown>

    // Motivos de rejeição (gravados para auditoria — e bloqueiam nova tentativa)
    let motivo: string | null = null
    if (referrerId === referredId) motivo = 'autoindicacao'
    else if (!referredUser || Date.now() - new Date(referredUser.created_at).getTime() > JANELA_CONTA_NOVA_MS) motivo = 'conta_antiga'
    else if (!referredProfile?.data_nascimento || !(referredProfile?.nome ?? metaIndicado.nome) || !metaIndicado.posicao) motivo = 'cadastro_incompleto'
    else {
      const { data: refAuth } = await admin.auth.admin.getUserById(referrerId)
      const metaIndicador = (refAuth?.user?.user_metadata ?? {}) as Record<string, unknown>
      const emailA = emailNorm(referrerProfile.recovery_email), emailB = emailNorm(referredProfile.recovery_email)
      const telA = soDigitos(metaIndicador.telefone), telB = soDigitos(metaIndicado.telefone)
      if (emailA && emailA === emailB) motivo = 'mesmo_email'
      else if (telA.length >= 8 && telA === telB) motivo = 'mesmo_telefone'
    }

    const { error: insErr } = await admin.from('indicacoes').insert({
      referrer_id: referrerId,
      referred_id: referredId,
      status: motivo ? 'rejeitada' : 'pendente',
      motivo,
    })
    if (insErr) return { ok: false, motivo: insErr.code === '23505' ? 'ja_registrada' : 'erro_banco' }

    // Marca no indicado quem indicou (informativo)
    await admin.auth.admin.updateUserById(referredId, { user_metadata: { referred_by: referrerId } })

    if (motivo) return { ok: false, motivo }

    // Não libera crédito no cadastro. A primeira avaliação oficial confirma a indicação.
    return { ok: true, referrerId, pendente: true }
  } catch (err) {
    console.error('[indicacao] confirmar', err)
    return { ok: false, motivo: 'erro_interno' }
  }
}

/**
 * Confirma uma indicação pendente depois de existir uma avaliação oficial.
 * A avaliação precisa pertencer a um treinador aprovado na lista gerenciada no servidor.
 */
export async function confirmarIndicacaoAposAvaliacao(
  admin: SupabaseClient,
  referredId: string,
  trainerId: string,
): Promise<void> {
  try {
    const { data: treinador } = await admin
      .from('verified_trainers')
      .select('approved')
      .eq('user_id', trainerId)
      .maybeSingle()
    if (treinador?.approved !== true) return

    const { data: avaliacao, error: avaliacaoError } = await admin
      .from('avaliacoes')
      .select('id')
      .eq('aluno_id', referredId)
      .eq('professor_id', trainerId)
      .limit(1)
      .maybeSingle()
    if (avaliacaoError || !avaliacao) return

    const { data: pendente, error: lookupError } = await admin
      .from('indicacoes')
      .select('referrer_id')
      .eq('referred_id', referredId)
      .eq('status', 'pendente')
      .maybeSingle()
    if (lookupError || !pendente?.referrer_id) return

    const { data: confirmada, error: updateError } = await admin
      .from('indicacoes')
      .update({ status: 'confirmada', motivo: null })
      .eq('referred_id', referredId)
      .eq('status', 'pendente')
      .select('referrer_id')
      .maybeSingle()
    if (updateError || !confirmada?.referrer_id) return

    await pagarPremios(admin, confirmada.referrer_id)
  } catch (err) {
    // A falha na contabilização não invalida uma avaliação oficial já registrada.
    console.error('[indicacao] confirmação pós-avaliação falhou', err)
  }
}

async function pagarPremios(admin: SupabaseClient, referrerId: string) {
  const { count } = await admin
    .from('indicacoes')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', referrerId)
    .eq('status', 'confirmada')
  const confirmadas = count ?? 0
  const devidos = Math.floor(confirmadas / AMIGOS_POR_PREMIO)

  const prefix = `referral-reward:${referrerId}:`
  const { data: existingGrants } = await admin
    .from('evaluation_credit_grants')
    .select('source_key')
    .like('source_key', `${prefix}%`)
  const grantedKeys = new Set((existingGrants ?? []).map((row) => row.source_key))

  let novos = 0
  for (let marco = 1; marco <= devidos; marco++) {
    const sourceKey = `${prefix}${marco}`
    if (grantedKeys.has(sourceKey)) continue

    const { error } = await admin.rpc('grant_evaluation_credit', {
      p_user_id: referrerId,
      p_source_key: sourceKey,
      p_amount: 1,
    })
    if (error) {
      console.error('[indicacao] falha ao liberar prêmio', error)
      continue
    }
    novos++
  }

  if (novos > 0) console.log(`[indicacao] 🎉 ${referrerId}: ${confirmadas} confirmadas → +${novos} card(s)`)
  return { confirmadas, novos }
}

/** Progresso do atleta logado: X/3 para o próximo prêmio. */
export async function progressoIndicacoes(admin: SupabaseClient, referrerId: string) {
  // GET também reconcilia concessões idempotentes caso uma chamada anterior tenha falhado.
  await pagarPremios(admin, referrerId)
  const [{ count }, { count: pendentesCount }] = await Promise.all([
    admin
      .from('indicacoes')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', referrerId)
      .eq('status', 'confirmada'),
    admin
      .from('indicacoes')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', referrerId)
      .eq('status', 'pendente'),
  ])
  const confirmadas = count ?? 0
  return {
    confirmadas,
    pendentes: pendentesCount ?? 0,
    noLote:  confirmadas % AMIGOS_POR_PREMIO,                       // 0..2 → "X/3"
    faltam:  AMIGOS_POR_PREMIO - (confirmadas % AMIGOS_POR_PREMIO), // para o próximo prêmio
    premios: Math.floor(confirmadas / AMIGOS_POR_PREMIO),
  }
}

