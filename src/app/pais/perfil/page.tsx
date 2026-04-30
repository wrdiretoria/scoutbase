import { redirect } from 'next/navigation'
import { createServerClient, createAdminClient } from '@/lib/supabase'

export default async function PaisPerfilPage() {
  // 1. Verifica sessão com client normal (respeita cookies do usuário)
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/pais/entrar')
  if (user.user_metadata?.tipo !== 'pai') redirect('/pais/entrar')

  const alunoScoutId = user.user_metadata?.aluno_scout_id as string | undefined
  const alunoIdMeta = user.user_metadata?.aluno_id as string | undefined

  if (!alunoScoutId && !alunoIdMeta) {
    return (
      <main className="p-8 text-center">
        <p className="text-gray-500 text-sm">
          Código do atleta não encontrado na sua conta. Entre em contato com o treinador.
        </p>
      </main>
    )
  }

  // 2. Busca atleta com admin client (bypassa RLS — seguro pois auth já foi verificada)
  const admin = createAdminClient()
  const query = admin
    .from('alunos')
    .select('id, nome, posicao, scout_id, ativo, professor_id, pai_auth_id, status_pagamento, turmas(id, nome)')

  const { data: aluno } = alunoIdMeta
    ? await query.eq('id', alunoIdMeta).single()
    : await query.eq('scout_id', alunoScoutId!).single()

  if (!aluno) {
    return (
      <main className="p-8 text-center">
        <p className="text-gray-500 text-sm">
          Atleta não encontrado. Verifique o número do atleta com o treinador.
        </p>
      </main>
    )
  }

  // 3. Se o pai_auth_id ainda não foi salvo, salva agora com admin client
  if (!(aluno as { pai_auth_id?: string | null }).pai_auth_id) {
    await admin.from('alunos').update({ pai_auth_id: user.id }).eq('id', aluno.id)
  }

  // Plano do treinador (admin client — profiles também tem RLS)
  let planoPago = false
  try {
    const { data: profile } = await admin
      .from('profiles')
      .select('plano')
      .eq('id', aluno.professor_id)
      .single()
    planoPago = profile?.plano === 'pago'
  } catch {
    // profiles sem coluna plano — padrão gratuito
  }

  // Próximos eventos da turma do atleta
  const turmaId = aluno.turmas && !Array.isArray(aluno.turmas)
    ? (aluno.turmas as { id?: string } | null)?.id ?? null
    : Array.isArray(aluno.turmas) && aluno.turmas.length > 0
    ? (aluno.turmas[0] as { id?: string }).id ?? null
    : null

  type EventoRow = {
    id: string
    tipo: string
    data: string
    horario: string | null
    local: string | null
    observacao: string | null
  }

  let proximosEventos: EventoRow[] = []
  if (turmaId) {
    const hoje = new Date().toISOString().split('T')[0]
    const { data: evs } = await admin
      .from('eventos')
      .select('id, tipo, data, horario, local, observacao')
      .eq('turma_id', turmaId)
      .gte('data', hoje)
      .order('data')
      .limit(5)
    proximosEventos = (evs ?? []) as EventoRow[]
  }

  // Presenças (admin client)
  const { data: presencas } = await admin
    .from('presencas')
    .select('presente')
    .eq('aluno_id', aluno.id)

  const totalPresencas = presencas?.length ?? 0
  const presentes = presencas?.filter((p) => p.presente).length ?? 0
  const frequencia = totalPresencas > 0 ? Math.round((presentes / totalPresencas) * 100) : null

  // Avaliações (admin client, só se plano pago)
  type AvaliacaoRow = {
    tecnico: number
    fisico: number
    tatico: number
    comportamento: number
    scout_score: number | null
    created_at: string
  }

  let avaliacoes: AvaliacaoRow[] = []
  let ultimaAvaliacao: AvaliacaoRow | null = null
  let scoutScore: number | null = null

  if (planoPago) {
    const { data } = await admin
      .from('avaliacoes')
      .select('tecnico, fisico, tatico, comportamento, scout_score, created_at')
      .eq('aluno_id', aluno.id)
      .order('created_at', { ascending: false })

    avaliacoes = (data ?? []) as AvaliacaoRow[]
    ultimaAvaliacao = avaliacoes[0] ?? null

    const scores = avaliacoes.map((a) => a.scout_score).filter((s) => s != null) as number[]
    scoutScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null
  }

  const turmaNome =
    aluno.turmas && !Array.isArray(aluno.turmas)
      ? (aluno.turmas as { id?: string; nome: string }).nome
      : Array.isArray(aluno.turmas) && aluno.turmas.length > 0
      ? (aluno.turmas[0] as { id?: string; nome: string }).nome
      : null

  const scoreColor =
    scoutScore === null
      ? 'text-gray-300'
      : scoutScore >= 75
      ? 'text-green-600'
      : scoutScore >= 50
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
              {(aluno as { scout_id?: string }).scout_id && (
                <p className="text-xs font-mono text-green-600 mt-1 tracking-widest">
                  {(aluno as { scout_id?: string }).scout_id}
                </p>
              )}
            </div>

            {planoPago && scoutScore !== null && (
              <div className="text-center flex-shrink-0">
                <p className="text-xs text-gray-400 mb-1">Scout Score</p>
                <p className={`text-5xl font-bold leading-none ${scoreColor}`}>
                  {scoutScore}
                </p>
                <p className="text-xs text-gray-400 mt-1">de 100</p>
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

        {/* Status financeiro — apenas informativo, nunca bloqueia acesso */}
        {(() => {
          const st = (aluno as { status_pagamento?: string | null }).status_pagamento
          const emDia = !st || st === 'em_dia' || st === 'pago'
          return (
            <div className={`rounded-xl border p-4 flex items-start gap-3 ${
              emDia
                ? 'bg-green-50 border-green-100'
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <span className="text-lg flex-shrink-0 mt-0.5">{emDia ? '✅' : '⚠️'}</span>
              <div>
                <p className={`text-sm font-semibold ${emDia ? 'text-green-800' : 'text-yellow-800'}`}>
                  {emDia ? 'Mensalidade em dia' : 'Mensalidade pendente'}
                </p>
                {!emDia && (
                  <p className="text-xs text-yellow-700 mt-0.5 leading-relaxed">
                    Entre em contato com o treinador para regularizar.
                  </p>
                )}
              </div>
            </div>
          )
        })()}

        {/* Próximos eventos da turma */}
        {proximosEventos.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Próximos eventos</h2>
            <ul className="space-y-2">
              {proximosEventos.map((ev) => {
                const tipoLabel: Record<string, string> = {
                  treino: 'Treino', jogo: 'Jogo', avaliacao: 'Avaliação',
                  reuniao: 'Reunião', outro: 'Outro',
                }
                const tipoCor: Record<string, string> = {
                  treino: 'bg-green-100 text-green-700',
                  jogo: 'bg-blue-100 text-blue-700',
                  avaliacao: 'bg-purple-100 text-purple-700',
                  reuniao: 'bg-amber-100 text-amber-700',
                  outro: 'bg-gray-100 text-gray-600',
                }
                return (
                  <li key={ev.id} className="flex items-start gap-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 shrink-0 ${tipoCor[ev.tipo] ?? 'bg-gray-100 text-gray-600'}`}>
                      {tipoLabel[ev.tipo] ?? ev.tipo}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800">
                        {new Date(ev.data + 'T12:00:00').toLocaleDateString('pt-BR', {
                          weekday: 'short', day: '2-digit', month: 'short',
                        })}
                        {ev.horario && ` · ${ev.horario.slice(0, 5)}`}
                      </p>
                      {ev.local && <p className="text-xs text-gray-400 truncate">{ev.local}</p>}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

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

        {/* Plano pago: última avaliação */}
        {planoPago && ultimaAvaliacao && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Última avaliação</h2>
              <p className="text-xs text-gray-400">
                {new Date(ultimaAvaliacao.created_at).toLocaleDateString('pt-BR', {
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
                  <p className="text-lg font-bold text-gray-800 mt-0.5">
                    {val} <span className="text-xs font-normal text-gray-400">/ 10</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Histórico (plano pago) */}
        {planoPago && avaliacoes.length > 1 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Histórico</h2>
            <ul className="divide-y divide-gray-50">
              {avaliacoes.map((av, i) => (
                <li key={i} className="flex items-center justify-between py-3">
                  <p className="text-xs text-gray-400">
                    {new Date(av.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </p>
                  {av.scout_score !== null && (
                    <span className={`text-sm font-bold ${
                      av.scout_score >= 75
                        ? 'text-green-600'
                        : av.scout_score >= 50
                        ? 'text-yellow-500'
                        : 'text-red-500'
                    }`}>
                      {av.scout_score}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {planoPago && avaliacoes.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="text-gray-400 text-sm">Nenhuma avaliação registrada ainda.</p>
          </div>
        )}

        <p className="text-center text-xs text-gray-300 pb-4">Gerado pelo ScoutBase</p>
      </div>
    </main>
  )
}
