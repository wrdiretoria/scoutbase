import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import RelatoriosClient from './RelatoriosClient'

export default async function RelatoriosPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all athletes
  const { data: rawAlunos } = await supabase
    .from('alunos')
    .select('id, nome, posicao, scout_id, ativo')
    .eq('professor_id', user.id)
    .eq('ativo', true)
    .order('nome')

  const alunoIds = (rawAlunos ?? []).map((a) => a.id)

  // Fetch latest evaluation per athlete (all, ordered by date)
  const { data: avaliacoes } = alunoIds.length
    ? await supabase
        .from('avaliacoes')
        .select('aluno_id, scout_score, tecnico, fisico, tatico, comportamento, created_at')
        .in('aluno_id', alunoIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  // Build enriched athlete list
  const atletas = (rawAlunos ?? []).map((aluno) => {
    const evals = (avaliacoes ?? []).filter((a) => a.aluno_id === aluno.id)
    const latest = evals[0] ?? null

    // Average scout score across all evaluations
    const scores = evals
      .filter((e) => e.scout_score !== null)
      .map((e) => e.scout_score as number)
    const avgScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null

    return {
      id: aluno.id,
      nome: aluno.nome,
      posicao: aluno.posicao ?? null,
      scout_id: aluno.scout_id ?? null,
      scoutScore: avgScore,
      ultimaAvaliacao: latest?.created_at ?? null,
      totalAvaliacoes: evals.length,
      tecnico: latest?.tecnico ?? null,
      fisico: latest?.fisico ?? null,
      tatico: latest?.tatico ?? null,
      comportamento: latest?.comportamento ?? null,
    }
  })

  return <RelatoriosClient atletas={atletas} />
}
