/**
 * POST /api/atleta/carta-pix
 * Gera cobrança R$5 (Pix ou cartão) para o atleta adquirir 1 card de avaliação.
 * Retorna { pixCode, qrCodeImage, paymentId } ou { ok: true, bonus: true } se for o 1º card grátis.
 *
 * externalReference = "carta_<userId>" — o webhook incrementa cards_disponiveis ao confirmar.
 */
import { createAdminClient } from '@/lib/supabase'
import { asaas } from '@/lib/asaas'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    // Apenas o próprio atleta autenticado pode gerar cobrança para si
    const { createServerClient } = await import('@/lib/supabase')
    const supabase = await createServerClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const { userId, nomeAtleta } = await req.json() as {
      userId?: string
      nomeAtleta?: string
    }

    if (!userId || !nomeAtleta) {
      return NextResponse.json({ error: 'Dados insuficientes.' }, { status: 400 })
    }

    // Garante que só gera cobrança para si mesmo
    if (userId !== authUser.id) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const admin = createAdminClient()

    // Busca dados do atleta
    const { data: { user } } = await admin.auth.admin.getUserById(userId)

    // Primeira avaliação é bônus — dá 1 card grátis se nunca teve card e nunca foi avaliado
    const cardsAtuais = (user?.user_metadata?.cards_disponiveis as number) ?? 0
    if (cardsAtuais === 0) {
      const { count } = await admin
        .from('avaliacoes')
        .select('id', { count: 'exact', head: true })
        .eq('aluno_id', userId)

      if ((count ?? 0) === 0) {
        await admin.auth.admin.updateUserById(userId, {
          user_metadata: { cards_disponiveis: 1 },
        })
        return NextResponse.json({ ok: true, bonus: true })
      }
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
