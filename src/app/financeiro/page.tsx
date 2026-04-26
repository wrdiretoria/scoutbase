import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import PainelFinanceiro from './PainelFinanceiro'

export default async function FinanceiroPage() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const opcaoRecebimento =
    (user.user_metadata?.opcao_recebimento as 'app' | 'fora' | undefined) ?? 'fora'
  const mensalidadePadrao = (user.user_metadata?.mensalidade_padrao as number | undefined) ?? 0
  const walletId = (user.user_metadata?.asaas_wallet_id as string | undefined) ?? null

  // Atletas com status de pagamento e mensalidade
  const { data: alunos } = await supabase
    .from('alunos')
    .select('id, nome, posicao, status_pagamento, mensalidade, asaas_customer_id, turmas(nome)')
    .eq('professor_id', user.id)
    .eq('ativo', true)
    .order('nome')

  // Histórico de pagamentos
  let pagamentos: {
    id: string
    aluno_id: string
    valor: number
    status: string
    competencia: string | null
    vencimento: string | null
    data_pagamento: string | null
    asaas_link: string | null
  }[] = []

  try {
    const { data } = await supabase
      .from('pagamentos')
      .select('id, aluno_id, valor, status, competencia, vencimento, data_pagamento, asaas_link')
      .eq('professor_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    pagamentos = (data ?? []) as typeof pagamentos
  } catch {
    // Tabela pagamentos pode ainda não existir
  }

  const alunosNormalizados = (alunos ?? []).map((a) => ({
    ...a,
    turmas: Array.isArray(a.turmas) ? null : (a.turmas as { nome: string } | null),
    status_pagamento: (a as { status_pagamento?: string }).status_pagamento ?? 'em_dia',
    mensalidade: (a as { mensalidade?: number }).mensalidade ?? 0,
    asaas_customer_id: (a as { asaas_customer_id?: string }).asaas_customer_id ?? null,
  }))

  return (
    <PainelFinanceiro
      alunos={alunosNormalizados}
      pagamentos={pagamentos}
      opcaoRecebimento={opcaoRecebimento}
      mensalidadePadrao={mensalidadePadrao}
      walletId={walletId}
    />
  )
}
