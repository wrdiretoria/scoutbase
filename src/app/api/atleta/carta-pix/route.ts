/**
 * POST /api/atleta/carta-pix
 * Gera cobrança PIX de R$5 para desbloquear a Carta de Avaliação.
 * Retorna { pixCode, qrCodeImage, paymentId }
 *
 * externalReference = "carta_<userId>" — o webhook identifica por esse prefixo
 * e chama admin.auth.admin.updateUserById(userId, { user_metadata: { carta_desbloqueada: true } })
 */
import { createAdminClient } from '@/lib/supabase'
import { asaas } from '@/lib/asaas'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { userId, nomeAtleta } = await req.json() as {
      userId?: string
      nomeAtleta?: string
    }

    if (!userId || !nomeAtleta) {
      return NextResponse.json({ error: 'Dados insuficientes.' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Verifica se já está desbloqueada
    const { data: { user } } = await admin.auth.admin.getUserById(userId)
    if (user?.user_metadata?.carta_desbloqueada) {
      return NextResponse.json({ ok: true, ja_desbloqueada: true })
    }

    // Primeira avaliação é bônus — desbloqueia grátis sem cobrar
    const { count } = await admin
      .from('avaliacoes')
      .select('id', { count: 'exact', head: true })
      .eq('aluno_id', userId)

    if ((count ?? 0) === 0) {
      await admin.auth.admin.updateUserById(userId, {
        user_metadata: { carta_desbloqueada: true },
      })
      return NextResponse.json({ ok: true, bonus: true })
    }

    // Reutiliza cliente Asaas existente ou cria novo
    let customerId = user?.user_metadata?.asaas_customer_id as string | undefined
    if (!customerId) {
      const cliente = await asaas.criarCliente({
        name:  nomeAtleta,
        email: user?.email ?? undefined,
      })
      customerId = cliente.id
      await admin.auth.admin.updateUserById(userId, {
        user_metadata: { asaas_customer_id: customerId },
      })
    }

    // Data de vencimento = hoje + 1 dia
    const vencimento = new Date()
    vencimento.setDate(vencimento.getDate() + 1)
    const dueDate = vencimento.toISOString().split('T')[0]

    // Cria cobrança R$5
    const cobranca = await asaas.criarCobranca({
      customer:          customerId,
      billingType:       'UNDEFINED',
      value:             5.00,
      dueDate,
      description:       'Card de Avaliação — Meu Craque',
      externalReference: `carta_${userId}`,
    })

    // Busca QR Code PIX
    const qr = await asaas.pixQrCode(cobranca.id)

    return NextResponse.json({
      ok:           true,
      paymentId:    cobranca.id,
      pixCode:      qr.payload,
      qrCodeImage:  qr.encodedImage,
      invoiceUrl:   cobranca.invoiceUrl ?? null,
    })
  } catch (err) {
    console.error('[carta-pix]', err)
    return NextResponse.json({ error: 'Erro ao gerar cobrança.' }, { status: 500 })
  }
}
