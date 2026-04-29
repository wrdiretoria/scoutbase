import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import RelatoriosClient from './RelatoriosClient'

export default async function RelatoriosPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all active athletes
  const { data: rawAlunos } = await supabase
    .from('alunos')
    .select('id, nome, posicao, scout_id, ativo')
    .eq('professor_id', user.id)
    .eq('ativo', true)
    .order('nome')

  const alunoIds = (rawAlunos ?? []).map((a) => a.id)

  // Fetch all evaluations ordered by date (to get latest + previous)
  const { data: avaliacoes } = alunoIds.length
    ? await supabase
        .from('avaliacoes')
        .select('aluno_id, scout_score, tecnico, fisico, tatico, comportamento, created_at')
        .in('aluno_id', alunoIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  // Fetch current month presencas for frequency
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  const startDate = startOfMonth.toISOString().split('T')[0]

  const { data: presencas } = alunoIds.length
    ? await supabase
        .from('presencas')
        .select('aluno_id, presente')
        .in('aluno_id', alunoIds)
        .gte('data', startDate)
    : { data: [] }

  // Build enriched athlete list
  const atletas = (rawAlunos ?? []).map((aluno) => {
    const evals = (avaliacoes ?? []).filter((a) => a.aluno_id === aluno.id)
    const latest = evals[0] ?? null
    const previous = evals[1] ?? null

    // Latest scout score (÷10 display) and evolution
    const latestScore = latest?.scout_score ?? null
    const prevScore   = previous?.scout_score ?? null
    const evolucao = latestScore !== null && prevScore !== null
      ? parseFloat(((latestScore - prevScore) / 10).toFixed(1))
      : null

    // Frequency this month
    const alunoPresencas = (presencas ?? []).filter((p) => p.aluno_id === aluno.id)
    const total    = alunoPresencas.length
    const presentes = alunoPresencas.filter((p) => p.presente).length
    const freqMes  = total > 0 ? Math.round((presentes / total) * 100) : null

    return {
      id: aluno.id,
      nome: aluno.nome,
      posicao: aluno.posicao ?? null,
      scout_id: aluno.scout_id ?? null,
      scoutScore: latestScore,
      ultimaAvaliacao: latest?.created_at ?? null,
      totalAvaliacoes: evals.length,
      tecnico:     latest?.tecnico     ?? null,
      fisico:      latest?.fisico      ?? null,
      tatico:      latest?.tatico      ?? null,
      comportamento: latest?.comportamento ?? null,
      evolucao,
      freqMes,
    }
  })

  return <RelatoriosClient atletas={atletas} />
}
