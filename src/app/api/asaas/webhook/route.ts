import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { upsertEntitlementPro, type EntityType } from '@/lib/entitlements'
import { PRODUTO_ENTITY_TYPE, type ProdutoKey } from '@/lib/produtos'

type AsaasWebhookPayload = {
  id: string
  event: string
  payment?: {
    id: string
    status: string
    value: number
    netValue: number
    dueDate: string
    paymentDate?: string
    externalReference?: string
    customer: string
  }
}

export async function POST(req: NextRequest) {
  try {
    // Valida o token do webhook (Asaas envia no header asaas-access-token)
    const webhookToken = req.headers.get('asaas-access-token')
    const expectedToken = process.env.ASAAS_WEBHOOK_SECRET

    if (!expectedToken) {
      console.error('ASAAS_WEBHOOK_SECRET não configurado — webhook rejeitado.')
      return NextResponse.json({ error: 'Configuração de segurança ausente.' }, { status: 500 })
    }

    const { timingSafeEqual } = await import('crypto')
    const tokensMatch = webhookToken &&
      webhookToken.length === expectedToken.length &&
      timingSafeEqual(Buffer.from(webhookToken), Buffer.from(expectedToken))

    if (!tokensMatch) {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 401 })
    }

    const payload = (await req.json()) as AsaasWebhookPayload
    const { event, payment } = payload

    if (!payment) {
      return NextResponse.json({ ok: true, message: 'Evento sem pagamento, ignorado.' })
    }

    const supabase = createAdminClient()

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    // ── Card de Avaliação: pagamento identificado pelo externalReference ──
    if (
      (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') &&
      payment.externalReference?.startsWith('carta_')
    ) {
      const userId = payment.externalReference.replace('carta_', '')
      if (userId && UUID_RE.test(userId)) {
        const adminClient = createAdminClient()
        const { data: { user: atletaUser } } = await adminClient.auth.admin.getUserById(userId)
        // Idempotência: ignora se este payment.id já foi processado
        const processados = (atletaUser?.user_metadata?.pagamentos_processados as string[] | null) ?? []
        if (!processados.includes(payment.id)) {
          const atual = (atletaUser?.user_metadata?.cards_disponiveis as number) ?? 0
          await adminClient.auth.admin.updateUserById(userId, {
            user_metadata: {
              cards_disponiveis: atual + 1,
              pagamentos_processados: [...processados, payment.id],
            },
          })
          console.log('[webhook] carta: card adicionado, total:', atual + 1)
        } else {
          console.log('[webhook] carta: pagamento já processado, ignorado')
        }
      }
      return NextResponse.json({ ok: true, event, tipo: 'carta' })
    }

    // ── Promoção de destaque (30 dias no topo da busca) ──
    if (
      (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') &&
      payment.externalReference?.startsWith('promover:')
    ) {
      const userId = payment.externalReference.replace('promover:', '')
      if (userId && UUID_RE.test(userId)) {
        const adminClient = createAdminClient()
        const { data: { user: atletaUser } } = await adminClient.auth.admin.getUserById(userId)
        // Idempotência: ignora se este payment.id já foi processado
        const processados = (atletaUser?.user_metadata?.pagamentos_processados as string[] | null) ?? []
        if (!processados.includes(payment.id)) {
          const promovido_ate = new Date()
          promovido_ate.setDate(promovido_ate.getDate() + 30)
          await adminClient.auth.admin.updateUserById(userId, {
            user_metadata: {
              promovido_ate: promovido_ate.toISOString(),
              pagamentos_processados: [...processados, payment.id],
            },
          })
          console.log('[webhook] promover: promoção ativada por 30 dias')
        } else {
          console.log('[webhook] promover: pagamento já processado, ignorado')
        }
      }
      return NextResponse.json({ ok: true, event, tipo: 'promover' })
    }

    // ── Planos /planos: Atleta Pro, Treinador/Scout Pro, Clube institucional ──
    // externalReference = "plano:<produto>:<userId>" — libera 30 dias em entitlements.
    if (
      (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') &&
      payment.externalReference?.startsWith('plano:')
    ) {
      const [, produto, userId] = payment.externalReference.split(':')
      if (userId && UUID_RE.test(userId) && produto in PRODUTO_ENTITY_TYPE) {
        const adminClient = createAdminClient()
        const { data: { user: compradorUser } } = await adminClient.auth.admin.getUserById(userId)
        const processados = (compradorUser?.user_metadata?.pagamentos_processados as string[] | null) ?? []
        if (!processados.includes(payment.id)) {
          const alvo = PRODUTO_ENTITY_TYPE[produto as Exclude<ProdutoKey, 'boost'>]
          const entityType: EntityType | null = alvo === 'self'
            ? (compradorUser?.user_metadata?.tipo as EntityType | undefined) ?? null
            : alvo

          if (entityType) {
            const ativoAte = new Date()
            ativoAte.setDate(ativoAte.getDate() + 30)
            await upsertEntitlementPro(adminClient, userId, entityType, ativoAte)

            await adminClient.auth.admin.updateUserById(userId, {
              user_metadata: { pagamentos_processados: [...processados, payment.id] },
            })
            console.log(`[webhook] plano ${produto}: entitlement 'pro' liberado até ${ativoAte.toISOString()} (entity_type=${entityType})`)
          } else {
            console.error(`[webhook] plano ${produto}: não foi possível determinar entity_type pro usuário ${userId}`)
          }
        } else {
          console.log('[webhook] plano: pagamento já processado, ignorado')
        }
      }
      return NextResponse.json({ ok: true, event, tipo: 'plano' })
    }

    // ── Add-on "Impulsionar perfil": 7 dias de destaque no ranking/busca ──
    // externalReference = "boost:<userId>"
    if (
      (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') &&
      payment.externalReference?.startsWith('boost:')
    ) {
      const userId = payment.externalReference.replace('boost:', '')
      if (userId && UUID_RE.test(userId)) {
        const adminClient = createAdminClient()
        const { data: { user: atletaUser } } = await adminClient.auth.admin.getUserById(userId)
        const processados = (atletaUser?.user_metadata?.pagamentos_processados as string[] | null) ?? []
        if (!processados.includes(payment.id)) {
          const expiraEm = new Date()
          expiraEm.setDate(expiraEm.getDate() + 7)
          await adminClient.from('profile_boosts').insert({ profile_id: userId, expires_at: expiraEm.toISOString() })

          await adminClient.auth.admin.updateUserById(userId, {
            user_metadata: { pagamentos_processados: [...processados, payment.id] },
          })
          console.log(`[webhook] boost: perfil em destaque até ${expiraEm.toISOString()}`)
        } else {
          console.log('[webhook] boost: pagamento já processado, ignorado')
        }
      }
      return NextResponse.json({ ok: true, event, tipo: 'boost' })
    }

    // ── ScoutBase: pagamentos de mensalidade ──
    // Idempotência: verifica se o evento já foi processado
    const { data: pagamento } = await supabase
      .from('pagamentos')
      .select('id, aluno_id, status')
      .eq('asaas_id', payment.id)
      .single()

    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      if (pagamento) {
        // Atualiza status do pagamento
        await supabase
          .from('pagamentos')
          .update({
            status: 'pago',
            data_pagamento: new Date().toISOString(),
          })
          .eq('asaas_id', payment.id)

        // Reativa o atleta
        await supabase
          .from('alunos')
          .update({ status_pagamento: 'em_dia' })
          .eq('id', pagamento.aluno_id)
      }
    }

    if (event === 'PAYMENT_OVERDUE') {
      if (pagamento) {
        // Atualiza status do pagamento
        await supabase
          .from('pagamentos')
          .update({ status: 'vencido' })
          .eq('asaas_id', payment.id)

        // Marca atleta como em atraso e pausa
        await supabase
          .from('alunos')
          .update({ status_pagamento: 'pausado' })
          .eq('id', pagamento.aluno_id)
      }
    }

    return NextResponse.json({ ok: true, event })
  } catch (err) {
    console.error('Webhook Asaas error:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
