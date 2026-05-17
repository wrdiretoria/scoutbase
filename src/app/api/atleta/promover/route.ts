/**
 * POST /api/atleta/promover
 * Cria cobrança Pix de R$ 9,90 para destaque na busca do scout por 30 dias.
 * externalReference = "promover:{userId}" — webhook ativa ao confirmar.
 */

import { NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { asaas } from '@/lib/asaas'

const VALOR_PROMOCAO = 9.90

export async function POST() {
  try {
    if (!process.env.ASAAS_API_KEY) {
      return NextResponse.json({ error: 'Pagamentos não configurados.' }, { status: 503 })
    }

    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    if (user.user_metadata?.tipo !== 'atleta') {
      return NextResponse.json({ error: 'Apenas atletas podem se promover.' }, { status: 403 })
    }

    const nome  = (user.user_metadata?.nome  as string | null) ?? 'Atleta'
    const email = user.email ?? ''

    // Busca ou cria cliente Asaas
    const admin = createAdminClient()
    let customerId = user.user_metadata?.asaas_customer_id as string | undefined

    if (!customerId) {
      const cliente = await asaas.criarCliente({ name: nome, email })
      customerId = cliente.id
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: { asaas_customer_id: customerId },
      })
    }

    // Vencimento: hoje + 1 dia
    const vencimento = new Date()
    vencimento.setDate(vencimento.getDate() + 1)
    const dueDateStr = vencimento.toISOString().split('T')[0]

    // Cria cobrança Pix
    const cobranca = await asaas.criarCobranca({
      customer:          customerId,
      billingType:       'PIX',
      value:             VALOR_PROMOCAO,
      dueDate:           dueDateStr,
      description:       'Destaque Meu Craque — 30 dias no topo da busca de scouts',
      externalReference: `promover:${user.id}`,
    })

    // Busca QR code Pix
    const qr = await asaas.pixQrCode(cobranca.id)

    return NextResponse.json({
      paymentId:    cobranca.id,
      valor:        VALOR_PROMOCAO,
      pixPayload:   qr.payload,
      pixQrCode:    qr.encodedImage,
      vencimento:   dueDateStr,
    })
  } catch (err) {
    console.error('[promover]', err)
    return NextResponse.json({ error: 'Erro ao criar cobrança. Tente novamente.' }, { status: 500 })
  }
}
