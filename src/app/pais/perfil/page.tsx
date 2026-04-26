import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'

export default async function PaisPerfilPage() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Só pais autenticados
  if (!user) redirect('/pais/entrar')
  if (user.user_metadata?.tipo !== 'pai') redirect('/pais/entrar')

  const alunoCodigo = user.user_metadata?.aluno_codigo as string | undefined
  const alunoIdMeta = user.user_metadata?.aluno_id as string | undefined

  if (!alunoCodigo && !alunoIdMeta) {
    return (
      <main className="p-8 text-center">
        <p className="text-gray-500 text-sm">Código do atleta não encontrado na sua conta. Entre em contato com o treinador.</p>
      </main>
    )
  }

  // Busca o atleta pelo id (mais confiável) ou pelo código
  const query = supabase
    .from('alunos')
    .select('id, nome, posicao, ativo, professor_id, turmas(nome)')

  const { data: aluno } = alunoIdMeta
    ? await query.eq('id', alunoIdMeta).single()
    : await query.eq('codigo', alunoCodigo!).single()

  if (!aluno) {
    return (
      <main className="p-8 text-center">
        <p className="text-gray-500 text-sm">Atleta não encontrado. Verifique o código com o treinador.</p>
      </main>
    )
  }

  // Plano do treinador: tenta buscar em profiles
  let planoPago = false
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plano')
      .eq('id', aluno.professor_id)
      .single()
    planoPago = profile?.plano === 'pago'
  } catch {
    // profiles sem coluna plano ou sem acesso — padrão gratuito
  }

  // Presenças
  const { data: presencas } = await supabase
    .from('presencas')
    .select('presente')
    .eq('aluno_id', aluno.id)

  const totalPresencas = presencas?.length ?? 0
  const presentes = presencas?.filter((p) => p.presente).length ?? 0
  const frequencia = totalPresencas > 0 ? Math.round((presentes / totalPresencas) * 100) : null

  // Avaliações (só se plano pago)
  let grupos: { data: string; score: number; tecnico: number; fisico: number; tatico: number; comportamento: number }[] = []
  let ultimaAvaliacao = null

  if (planoPago) {
    const { data: avaliacoes } = await supabase
      .from('avaliacoes')
      .select('nota, categoria, data')
      .eq('aluno_id', aluno.id)
      .order('data', { ascending: false })

    const byDate: Record<string, Record<string, number>> = {}
    for (const av of avaliacoes ?? []) {
      if (!av.data) continue
      if (!byDate[av.data]) byDate[av.data] = {}
      if (byDate[av.data][av.categoria] === undefined) byDate[av.data][av.categoria] = av.nota
    }

    for (const [date, pilares] of Object.entries(byDate)) {
      const t = pilares['Técnico']
      const f = pilares['Físico']
      const ta = pilares['Tático']
      const c = pilares['Comportamento']
      if (t !== undefined && f !== undefined && ta !== undefined && c !== undefined) {
        grupos.push({
          data: date,
          tecnico: t, fisico: f, tatico: ta, comportamento: c,
          score: Math.round(((t + f + ta + c) / 4) * 10) / 10,
        })
      }
    }
    grupos.sort((a, b) => b.data.localeCompare(a.data))
    ultimaAvaliacao = grupos[0] ?? null
  }

  const turmaNome =
    aluno.turmas && !Array.isArray(aluno.turmas)
      ? (aluno.turmas as { nome: string }).nome
      : null

  const scoreColor =
    ultimaAvaliacao === null
      ? 'text-gray-300'
      : ultimaAvaliacao.score >= 7.5
      ? 'text-green-600'
      : ultimaAvaliacao.score >= 5
      ? 'text-yellow-500'
      : 'text-red-500'

  return (
    <main className="p-6">
      <div className="max-w-md mx-auto space-y-5">

        {/* Card identidade */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">
                Relatório do Atleta
              </p>
              <h1 className="text-2xl font-bold text-gray-900 truncate">{aluno.nome}</h1>
              {aluno.posicao && <p className="text-sm text-gray-500 mt-0.5">{aluno.posicao}</p>}
              {turmaNome && <p className="text-xs text-gray-400 mt-0.5">{turmaNome}</p>}
            </div>

            {planoPago && ultimaAvaliacao && (
              <div className="text-center flex-shrink-0">
                <p className="text-xs text-gray-400 mb-1">Scout Score</p>
                <p className={`text-5xl font-bold leading-none ${scoreColor}`}>
                  {ultimaAvaliacao.score}
                </p>
                <p className="text-xs text-gray-400 mt-1">de 10</p>
              </div>
            )}
          </div>
        </div>

        {/* Frequência — sempre visível */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-400 mb-1">Frequência</p>
          <p className={`text-3xl font-bold ${
            frequencia === null ? 'text-gray-300' : frequencia >= 75 ? 'text-green-600' : 'text-red-500'
          }`}>
            {frequencia !== null ? `${frequencia}%` : '—'}
          </p>
          {totalPresencas > 0 && (
            <p className="text-xs text-gray-400 mt-1">{presentes} de {totalPresencas} aulas presentes</p>
          )}
          {frequencia !== null && frequencia < 75 && (
            <p className="text-xs text-red-500 mt-2 font-medium">
              ⚠️ Frequência abaixo de 75% — atenção necessária
            </p>
          )}
        </div>

        {/* Plano gratuito: aviso */}
        {!planoPago && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-sm text-amber-800 font-medium">
              Boletim completo disponível no plano avançado
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Peça ao treinador para ativar o plano completo e ver Scout Score, avaliações e relatórios.
            </p>
          </div>
        )}

        {/* Plano pago: avaliações */}
        {planoPago && ultimaAvaliacao && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Última avaliação</h2>
              <p className="text-xs text-gray-400">
                {new Date(ultimaAvaliacao.data).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([
                ['Técnico', ultimaAvaliacao.tecnico],
                ['Físico', ultimaAvaliacao.fisico],
                ['Tático', ultimaAvaliacao.tatico],
                ['Comportamento', ultimaAvaliacao.comportamento],
              ] as [string, number][]).map(([label, val]) => (
                <div key={label} className="bg-gray-50 rounded-lg px-3 py-3">
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-lg font-bold text-gray-800 mt-0.5">{val} <span className="text-xs font-normal text-gray-400">/ 10</span></p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Histórico de avaliações (plano pago) */}
        {planoPago && grupos.length > 1 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Histórico</h2>
            <ul className="divide-y divide-gray-50">
              {grupos.map((g) => (
                <li key={g.data} className="flex items-center justify-between py-3">
                  <p className="text-xs text-gray-400">
                    {new Date(g.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  <span className={`text-sm font-bold ${
                    g.score >= 7.5 ? 'text-green-600' : g.score >= 5 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {g.score}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {planoPago && grupos.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="text-gray-400 text-sm">Nenhuma avaliação registrada ainda.</p>
          </div>
        )}

        <p className="text-center text-xs text-gray-300 pb-4">Gerado pelo ScoutBase</p>
      </div>
    </main>
  )
}
