import { redirect, notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { createServerClient } from '@/lib/supabase'
import PerfilAtleta from './PerfilAtleta'

type Props = {
  params: Promise<{ id: string }>
}

export default async function AlunoPerfilPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // ── Aluno ────────────────────────────────────────────────────────────────
  const { data: aluno } = await supabase
    .from('alunos')
    .select(
      'id, nome, posicao, responsavel, telefone, ativo, token_acesso, codigo, turma_id, mensalidade, status_pagamento, data_nascimento, turmas(nome)'
    )
    .eq('id', id)
    .eq('professor_id', user.id)
    .single()

  if (!aluno) notFound()

  // ── Avaliações ───────────────────────────────────────────────────────────
  const { data: avaliacoes } = await supabase
    .from('avaliacoes')
    .select('scout_score, created_at, tecnico, fisico, tatico, comportamento')
    .eq('aluno_id', id)
    .order('created_at', { ascending: false })

  const scores = (avaliacoes ?? [])
    .map((a) => a.scout_score)
    .filter((n) => n != null) as number[]

  const scoutScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null

  // ── Presenças (com campo data) ───────────────────────────────────────────
  const { data: presencas } = await supabase
    .from('presencas')
    .select('presente, data')
    .eq('aluno_id', id)
    .order('data', { ascending: false })

  const totalPresencas = presencas?.length ?? 0
  const presentes = presencas?.filter((p) => p.presente).length ?? 0
  const frequencia =
    totalPresencas > 0 ? Math.round((presentes / totalPresencas) * 100) : null

  // Frequência do mês atual
  const agora = new Date()
  const primeiroDiaMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
    .toISOString()
    .split('T')[0]

  const presencasMes = (presencas ?? []).filter(
    (p) => p.data && p.data >= primeiroDiaMes
  )
  const totalMes = presencasMes.length
  const presentesMes = presencasMes.filter((p) => p.presente).length
  const frequenciaMes =
    totalMes > 0 ? Math.round((presentesMes / totalMes) * 100) : null

  // ── Pagamentos (try-catch) ───────────────────────────────────────────────
  let pagamentos: {
    id: string
    valor: number
    status: string
    created_at: string
    link_pix: string | null
  }[] = []
  try {
    const { data } = await supabase
      .from('pagamentos')
      .select('id, valor, status, created_at, link_pix')
      .eq('aluno_id', id)
      .order('created_at', { ascending: false })
    pagamentos = data ?? []
  } catch {
    /* tabela pode não existir ainda */
  }

  // ── Observações (try-catch) ──────────────────────────────────────────────
  let observacoes: { id: string; texto: string; created_at: string }[] = []
  try {
    const { data } = await supabase
      .from('observacoes')
      .select('id, texto, created_at')
      .eq('aluno_id', id)
      .order('created_at', { ascending: false })
    observacoes = data ?? []
  } catch {
    /* tabela pode não existir ainda */
  }

  // ── Turmas (para o formulário de edição) ─────────────────────────────────
  const { data: turmasList } = await supabase
    .from('turmas')
    .select('id, nome')
    .eq('professor_id', user.id)
    .order('nome')

  // ── Link público ─────────────────────────────────────────────────────────
  const hdrs = await headers()
  const host = hdrs.get('host') ?? 'localhost:3000'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  const linkPublico = aluno.token_acesso
    ? `${proto}://${host}/p/${aluno.token_acesso}`
    : null

  // ── Turma nome ───────────────────────────────────────────────────────────
  const turmaNome =
    aluno.turmas && !Array.isArray(aluno.turmas)
      ? (aluno.turmas as { nome: string }).nome
      : null

  return (
    <PerfilAtleta
      aluno={{
        id: aluno.id,
        nome: aluno.nome,
        posicao: aluno.posicao ?? null,
        responsavel: aluno.responsavel ?? null,
        telefone: aluno.telefone ?? null,
        ativo: aluno.ativo,
        token_acesso: aluno.token_acesso ?? null,
        codigo: (aluno as { codigo?: string }).codigo ?? null,
        turma_id: (aluno as { turma_id?: string }).turma_id ?? null,
        mensalidade: (aluno as { mensalidade?: number }).mensalidade ?? null,
        status_pagamento:
          (aluno as { status_pagamento?: string }).status_pagamento ?? null,
        data_nascimento:
          (aluno as { data_nascimento?: string }).data_nascimento ?? null,
        turmas: turmaNome ? { nome: turmaNome } : null,
      }}
      avaliacoes={avaliacoes ?? []}
      presencas={presencas ?? []}
      pagamentos={pagamentos}
      observacoes={observacoes}
      turmasList={turmasList ?? []}
      scoutScore={scoutScore}
      frequencia={frequencia}
      frequenciaMes={frequenciaMes}
      presentes={presentes}
      totalPresencas={totalPresencas}
      linkPublico={linkPublico}
      professorId={user.id}
    />
  )
}
