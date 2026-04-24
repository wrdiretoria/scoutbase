import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'

export default async function DashboardPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Alunos do professor logado
  const { data: alunos } = await supabase
    .from('alunos')
    .select('id, nome, ativo')
    .eq('professor_id', user.id)

  const totalAtivos = alunos?.filter((a) => a.ativo).length ?? 0
  const alunoIds = alunos?.map((a) => a.id) ?? []

  // Presenças de todos os alunos do professor
  const { data: presencas } = alunoIds.length
    ? await supabase
        .from('presencas')
        .select('aluno_id, presente')
        .in('aluno_id', alunoIds)
    : { data: [] }

  // Frequência por aluno
  const frequenciaPorAluno = alunoIds.map((id) => {
    const registros = presencas?.filter((p) => p.aluno_id === id) ?? []
    if (registros.length === 0) return { id, freq: null }
    const presentes = registros.filter((p) => p.presente).length
    return { id, freq: Math.round((presentes / registros.length) * 100) }
  })

  const freqValidas = frequenciaPorAluno
    .filter((f) => f.freq !== null)
    .map((f) => f.freq as number)

  const mediaFrequencia =
    freqValidas.length > 0
      ? Math.round(freqValidas.reduce((a, b) => a + b, 0) / freqValidas.length)
      : 0

  // Alertas: alunos ativos com frequência < 75%
  const alertasRisco = frequenciaPorAluno
    .filter((f) => f.freq !== null && f.freq < 75)
    .map((f) => ({
      ...alunos?.find((a) => a.id === f.id),
      frequencia: f.freq as number,
    }))

  const nomeUsuario = user.user_metadata?.nome ?? user.email

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Bem-vindo, {nomeUsuario}</p>
        </div>

        {/* Cards de métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-500">Alunos ativos</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{totalAtivos}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-500">Frequência média</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {freqValidas.length > 0 ? `${mediaFrequencia}%` : '—'}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-500">Alertas de risco</p>
            <p
              className={`text-3xl font-bold mt-1 ${
                alertasRisco.length > 0 ? 'text-red-600' : 'text-gray-900'
              }`}
            >
              {alertasRisco.length}
            </p>
          </div>
        </div>

        {/* Alertas de risco */}
        {alertasRisco.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Alunos em risco (frequência abaixo de 75%)
            </h2>
            <ul className="divide-y divide-gray-100">
              {alertasRisco.map((aluno) => (
                <li
                  key={aluno.id}
                  className="flex items-center justify-between py-3"
                >
                  <span className="text-sm text-gray-800">{aluno.nome}</span>
                  <span className="text-sm font-medium text-red-600">
                    {aluno.frequencia}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Lista de alunos */}
        {alunos && alunos.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Seus alunos
            </h2>
            <ul className="divide-y divide-gray-100">
              {alunos.map((aluno) => {
                const dadosFreq = frequenciaPorAluno.find((f) => f.id === aluno.id)
                return (
                  <li
                    key={aluno.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          aluno.ativo ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      />
                      <span className="text-sm text-gray-800">{aluno.nome}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {dadosFreq?.freq != null ? `${dadosFreq.freq}%` : 'Sem presença'}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {alunos?.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
            <p className="text-gray-400 text-sm">Nenhum aluno cadastrado ainda.</p>
          </div>
        )}
      </div>
    </main>
  )
}
