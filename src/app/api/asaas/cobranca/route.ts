import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { asaas, calcularSplit } from '@/lib/asaas'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const body = await req.json() as {
      aluno_id: string
      nome_aluno: string
      valor: number
      vencimento: string
      competencia: string
      wallet_id?: string | null
    }

    const { aluno_id, nome_aluno, valor, vencimento, competencia, wallet_id } = body

    if (!aluno_id || !valor || !vencimento) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 })
    }

    // Verifica se o atleta pertence ao professor
    const { data: aluno } = await supabase
      .from('alunos')
      .select('id, asaas_customer_id')
      .eq('id', aluno_id)
      .eq('professor_id', user.id)
      .single()

    if (!aluno) {
      return NextResponse.json({ error: 'Atleta não encontrado.' }, { status: 404 })
    }

    // Cria ou reutiliza cliente Asaas do atleta
    let customerId = (aluno as { asaas_customer_id?: string }).asaas_customer_id

    if (!customerId) {
      const cliente = await asaas.criarCliente({ name: nome_aluno })
      customerId = cliente.id

      // Salva o customer_id no atleta
      await supabase
        .from('alunos')
        .update({ asaas_customer_id: customerId })
        .eq('id', aluno_id)
    }

    // Monta splits se o treinador tiver walletId cadastrado
    const splits = wallet_id
      ? [{ walletId: wallet_id, percentualValue: 96.01 }]
      : undefined

    const { treinador } = calcularSplit(valor)

    // Cria cobrança no Asaas
    const cobranca = await asaas.criarCobranca({
      customer: customerId,
      billingType: 'PIX',
      value: valor,
      dueDate: vencimento,
      description: `Mensalidade Meu Craque — ${nome_aluno} — ${competencia}`,
      externalReference: aluno_id,
      splits,
    })

    // Salva pagamento no banco
    const { data: pagamento, error: dbError } = await supabase
      .from('pagamentos')
      .insert({
        aluno_id,
        professor_id: user.id,
        valor,
        status: 'pendente',
        competencia,
        vencimento,
        asaas_id: cobranca.id,
        asaas_link: cobranca.invoiceUrl ?? null,
      })
      .select()
      .single()

    if (dbError) {
      console.error('DB error saving pagamento:', dbError)
    }

    return NextResponse.json({
      ok: true,
      cobranca_id: cobranca.id,
      link: cobranca.invoiceUrl,
      valor_treinador: wallet_id ? treinador : valor,
      pagamento: pagamento ?? null,
    })
  } catch (err) {
    console.error('Erro ao gerar cobrança:', err)
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}