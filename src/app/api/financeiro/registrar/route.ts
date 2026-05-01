import { createServerClient, createAdminClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { alunoId, valor, dataPagamento, formaPagamento } = await req.json() as {
    alunoId: string
    valor: number
    dataPagamento: string
    formaPagamento: 'pix' | 'dinheiro' | 'cartao'
  }

  if (!alunoId || !valor || !dataPagamento || !formaPagamento) {
    return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
  }

  const mesAno = dataPagamento.slice(0, 7) // 'YYYY-MM'
  const admin = createAdminClient()

  // 1. Insere pagamento
  const { data: pagamento, error: errPag } = await admin
    .from('pagamentos')
    .insert({
      aluno_id: alunoId,
      professor_id: user.id,
      valor,
      status: 'pago',
      data_pagamento: dataPagamento,
      forma_pagamento: formaPagamento,
      mes_ano: mesAno,
      competencia: mesAno,
    })
    .select()
    .single()

  if (errPag) {
    console.error('[registrar-pagamento]', errPag)
    return NextResponse.json({ error: 'Erro ao salvar pagamento.' }, { status: 500 })
  }

  // 2. Atualiza status do atleta para em_dia
  await admin
    .from('alunos')
    .update({ status_pagamento: 'em_dia' })
    .eq('id', alunoId)
    .eq('professor_id', user.id)

  return NextResponse.json({ pagamento })
}
