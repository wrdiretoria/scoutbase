import { redirect } from 'next/navigation'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import PainelFinanceiro from './PainelFinanceiro'

export default async function FinanceiroPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  // Atletas ativos com todos os dados necessários
  const { data: alunos } = await admin
    .from('alunos')
    .select('id, nome, scout_id, telefone, responsavel, status_pagamento, mensalidade, turma_id, turmas(id, nome)')
    .eq('professor_id', user.id)
    .eq('ativo', true)
    .order('nome')

  // Turmas do professor (para filtro)
  const { data: turmas } = await admin
    .from('turmas')
    .select('id, nome')
    .eq('professor_id', user.id)
    .order('nome')

  // Pagamentos dos últimos 3 meses
  const tresMesesAtras = new Date()
  tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3)
  const dataCorte = tresMesesAtras.toISOString().slice(0, 7)

  const { data: pagamentos } = await admin
    .from('pagamentos')
    .select('id, aluno_id, valor, status, data_pagamento, forma_pagamento, mes_ano, competencia, vencimento, asaas_link')
    .eq('professor_id', user.id)
    .gte('mes_ano', dataCorte)
    .order('data_pagamento', { ascending: false })

  const opcaoRecebimento =
    (user.user_metadata?.opcao_recebimento as 'app' | 'fora' | undefined) ?? 'fora'
  const mensalidadePadrao = (user.user_metadata?.mensalidade_padrao as number | undefined) ?? 0
  const walletId = (user.user_metadata?.asaas_wallet_id as string | undefined) ?? null
  const professorId = user.id

  // Normaliza relações
  const alunosNorm = (alunos ?? []).map((a) => ({
    ...a,
    turmas: Array.isArray(a.turmas) ? null : (a.turmas as { id: string; nome: string } | null),
    status_pagamento: (a.status_pagamento as string | null) ?? 'em_dia',
    mensalidade: (a.mensalidade as number | null) ?? 0,
    telefone: (a.telefone as string | null) ?? null,
    responsavel: (a.responsavel as string | null) ?? null,
    scout_id: (a.scout_id as string | null) ?? null,
    turma_id: (a.turma_id as string | null) ?? null,
  }))

  return (
    <PainelFinanceiro
      alunos={alunosNorm}
      pagamentos={(pagamentos ?? []) as {
        id: string; aluno_id: string; valor: number; status: string
        data_pagamento: string | null; forma_pagamento: string | null
        mes_ano: string | null; competencia: string | null
        vencimento: string | null; asaas_link: string | null
      }[]}
      turmas={(turmas ?? []) as { id: string; nome: string }[]}
      opcaoRecebimento={opcaoRecebimento}
      mensalidadePadrao={mensalidadePadrao}
      walletId={walletId}
      professorId={professorId}
    />
  )
}
