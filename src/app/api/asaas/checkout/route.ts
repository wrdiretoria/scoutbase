/**
 * POST /api/asaas/checkout
 * Cria cobrança Pix pra um dos produtos da página /planos. Body: { produto }
 *
 * Mesmo padrão de /api/atleta/promover e /api/atleta/carta-pix: cliente Asaas
 * reaproveitado (cacheado em user_metadata.asaas_customer_id), cobrança Pix
 * única com externalReference codificando o que liberar, QR code devolvido
 * pro front. O webhook decodifica o externalReference e libera o acesso.
 *
 * "Plano mensal" aqui é uma cobrança Pix avulsa que libera 30 dias de acesso
 * (igual ao "Promover perfil" já existente) — não é uma assinatura recorrente
 * de verdade no Asaas (isso seria um fluxo de pagamento novo, fora do que foi
 * pedido: reaproveitar o padrão já existente). Passados os 30 dias, o usuário
 * paga de novo pra renovar.
 */
import { NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import { asaas } from '@/lib/asaas'
import { PRODUTOS, type ProdutoKey } from '@/lib/produtos'

export async function POST(req: Request) {
  try {
    if (!process.env.ASAAS_API_KEY) {
      return NextResponse.json({ error: 'Pagamentos não configurados.' }, { status: 503 })
    }

    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { produto } = await req.json() as { produto?: ProdutoKey }
    const config = produto ? PRODUTOS[produto] : undefined
    if (!produto || !config) {
      return NextResponse.json({ error: 'Produto inválido.' }, { status: 400 })
    }

    const tipo = (user.user_metadata?.tipo as string | undefined) ?? ''
    if (config.tiposPermitidos && !config.tiposPermitidos.includes(tipo)) {
      return NextResponse.json({ error: 'Este plano não está disponível para o seu tipo de conta.' }, { status: 403 })
    }

    const nome  = (user.user_metadata?.nome as string | null) ?? 'Usuário'
    const email = user.email ?? ''

    const admin = createAdminClient()
    let customerId = user.user_metadata?.asaas_customer_id as string | undefined
    if (!customerId) {
      const cliente = await asaas.criarCliente({ name: nome, email })
      customerId = cliente.id
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: { asaas_customer_id: customerId },
      })
    }

    const vencimento = new Date()
    vencimento.setDate(vencimento.getDate() + 1)
    const dueDateStr = vencimento.toISOString().split('T')[0]

    const externalReference = produto === 'boost'
      ? `boost:${user.id}`
      : `plano:${produto}:${user.id}`

    const cobranca = await asaas.criarCobranca({
      customer:          customerId,
      billingType:       'UNDEFINED',
      value:             config.valor,
      dueDate:           dueDateStr,
      description:       config.descricao,
      externalReference,
    })

    const qr = await asaas.pixQrCode(cobranca.id)

    return NextResponse.json({
      ok:         true,
      paymentId:  cobranca.id,
      valor:      config.valor,
      pixCode:    qr.payload,
      qrCodeImage: qr.encodedImage,
      invoiceUrl: cobranca.invoiceUrl ?? null,
      vencimento: dueDateStr,
    })
  } catch (err) {
    console.error('[asaas/checkout]', err)
    return NextResponse.json({ error: 'Erro ao criar cobrança. Tente novamente.' }, { status: 500 })
  }
}
