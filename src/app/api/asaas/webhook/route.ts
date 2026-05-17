import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'

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

    if (webhookToken !== expectedToken) {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 401 })
    }

    const payload = (await req.json()) as AsaasWebhookPayload
    const { event, payment } = payload

    if (!payment) {
      return NextResponse.json({ ok: true, message: 'Evento sem pagamento, ignorado.' })
    }

    const supabase = await createServerClient()

    // ── Carta de Avaliação: pagamento identificado pelo externalReference ──
    if (
      (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') &&
      payment.externalReference?.startsWith('carta_')
    ) {
      const userId = payment.externalReference.replace('carta_', '')
      if (userId) {
        const adminClient = createAdminClient()
        await adminClient.auth.admin.updateUserById(userId, {
          user_metadata: { carta_desbloqueada: true },
        })
        console.log(`[webhook] Carta desbloqueada para userId=${userId}`)
      }
      return NextResponse.json({ ok: true, event, tipo: 'carta' })
    }

    // ── Promoção de destaque (30 dias no topo da busca) ──
    if (
      (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') &&
      payment.externalReference?.startsWith('promover:')
    ) {
      const userId = payment.externalReference.replace('promover:', '')
      if (userId) {
        const adminClient = createAdminClient()
        const promovido_ate = new Date()
        promovido_ate.setDate(promovido_ate.getDate() + 30)
        await adminClient.auth.admin.updateUserById(userId, {
          user_metadata: { promovido_ate: promovido_ate.toISOString() },
        })
        console.log(`[webhook] Promoção ativada para userId=${userId} até ${promovido_ate.toISOString()}`)
      }
      return NextResponse.json({ ok: true, event, tipo: 'promover' })
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
