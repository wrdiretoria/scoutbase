import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'

function getSaudacao() {
  const hora = new Date().getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

const acoesRapidas = [
  {
    icon: '⚽',
    label: 'Novo atleta',
    href: '/alunos',
    bg: 'bg-green-600 hover:bg-green-700',
    text: 'text-white',
  },
  {
    icon: '✅',
    label: 'Marcar presença',
    href: '/presencas',
    bg: 'bg-white hover:bg-gray-50 border border-gray-200',
    text: 'text-gray-800',
  },
  {
    icon: '📊',
    label: 'Gerar relatório',
    href: '/alunos',
    bg: 'bg-white hover:bg-gray-50 border border-gray-200',
    text: 'text-gray-800',
  },
  {
    icon: '💰',
    label: 'Ver financeiro',
    href: '/financeiro',
    bg: 'bg-white hover:bg-gray-50 border border-gray-200',
    text: 'text-gray-800',
  },
]

export default async function DashboardPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const nomeUsuario =
    (user.user_metadata?.nome as string | undefined)?.split(' ')[0] ??
    user.email?.split('@')[0] ??
    'Treinador'

  // ── Alunos ──────────────────────────────────────────────────
  const { data: alunos } = await supabase
    .from('alunos')
    .select('id, nome, ativo')
    .eq('professor_id', user.id)
    .order('nome')

  const totalAtivos = alunos?.filter((a) => a.ativo).length ?? 0
  const alunoIds = alunos?.map((a) => a.id) ?? []

  // ── Presenças ────────────────────────────────────────────────
  const { data: presencas } = alunoIds.length
    ? await supabase
        .from('presencas')
        .select('aluno_id, presente, data')
        .in('aluno_id', alunoIds)
    : { data: [] }

  // ── Avaliações (scout_score + created_at) ───────────────────
  const { data: avaliacoes } = alunoIds.length
    ? await supabase
        .from('avaliacoes')
        .select('aluno_id, scout_score, created_at')
        .in('aluno_id', alunoIds)
    : { data: [] }

  // Média de scout_score por atleta (0-100)
  const scorePorAluno = new Map<string, number>()
  for (const id of alunoIds) {
    const scores = (avaliacoes ?? [])
      .filter((a) => a.aluno_id === id && a.scout_score != null)
      .map((a) => a.scout_score as number)
    if (scores.length > 0) {
      scorePorAluno.set(
        id,
        Math.round(scores.reduce((x, y) => x + y, 0) / scores.length)
      )
    }
  }

  // ── Evolução Geral (score médio mês atual vs mês anterior) ──
  const agora = new Date()
  const inicioMesAtual = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString()
  const inicioMesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1).toISOString()
  const fimMesAnterior = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString()

  const scoresAtual = (avaliacoes ?? [])
    .filter((a) => a.scout_score != null && a.created_at >= inicioMesAtual)
    .map((a) => a.scout_score as number)

  const scoresAnterior = (avaliacoes ?? [])
    .filter(
      (a) =>
        a.scout_score != null &&
        a.created_at >= inicioMesAnterior &&
        a.created_at < fimMesAnterior
    )
    .map((a) => a.scout_score as number)

  const mediaAtual =
    scoresAtual.length > 0
      ? scoresAtual.reduce((a, b) => a + b, 0) / scoresAtual.length
      : null

  const mediaAnterior =
    scoresAnterior.length > 0
      ? scoresAnterior.reduce((a, b) => a + b, 0) / scoresAnterior.length
      : null

  const evolucao: number | null =
    mediaAtual !== null && mediaAnterior !== null && mediaAnterior > 0
      ? Math.round(((mediaAtual - mediaAnterior) / mediaAnterior) * 100)
      : null

  // ── Treino hoje ──────────────────────────────────────────────
  const hojeStr = new Date().toISOString().split('T')[0]
  const presencasHoje = (presencas ?? []).filter((p) => p.data?.startsWith(hojeStr))
  const treinoHoje = presencasHoje.length > 0 ? presencasHoje.length : null

  // ── Frequência mensal ────────────────────────────────────────
  const primeiroDiaMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
    .toISOString()
    .split('T')[0]

  const presencasMes = (presencas ?? []).filter(
    (p) => p.data && p.data >= primeiroDiaMes
  )

  const freqMensal = (() => {
    const porAluno = alunoIds.map((id) => {
      const reg = presencasMes.filter((p) => p.aluno_id === id)
      if (!reg.length) return null
      return (reg.filter((p) => p.presente).length / reg.length) * 100
    })
    const validas = porAluno.filter((v) => v !== null) as number[]
    return validas.length
      ? Math.round(validas.reduce((a, b) => a + b, 0) / validas.length)
      : null
  })()

  // ── Frequência total por aluno (alertas) ─────────────────────
  const frequenciaPorAluno = alunoIds.map((id) => {
    const reg = (presencas ?? []).filter((p) => p.aluno_id === id)
    if (!reg.length) return { id, freq: null }
    return {
      id,
      freq: Math.round((reg.filter((p) => p.presente).length / reg.length) * 100),
    }
  })

  const alertasRisco = frequenciaPorAluno
    .filter((f) => f.freq !== null && f.freq < 75)
    .map((f) => ({
      ...alunos?.find((a) => a.id === f.id),
      frequencia: f.freq as number,
    }))

  // ── Cards ────────────────────────────────────────────────────
  const cards = [
    {
      label: 'Atletas ativos',
      valor: totalAtivos,
      sub: totalAtivos === 1 ? 'atleta cadastrado' : 'atletas cadastrados',
      cor: 'text-gray-900',
      icon: '👥',
    },
    {
      label: 'Treino hoje',
      valor: treinoHoje ?? '—',
      sub: treinoHoje
        ? `${treinoHoje} atleta${treinoHoje > 1 ? 's' : ''} registrado${treinoHoje > 1 ? 's' : ''}`
        : 'Sem registro hoje',
      cor: treinoHoje ? 'text-green-600' : 'text-gray-400',
      icon: '🏃',
    },
    {
      label: 'Frequência mensal',
      valor: freqMensal !== null ? `${freqMensal}%` : '—',
      sub:
        freqMensal !== null
          ? freqMensal >= 75
            ? 'Acima da meta'
            : 'Abaixo da meta'
          : 'Sem registros este mês',
      cor:
        freqMensal === null
          ? 'text-gray-400'
          : freqMensal >= 75
          ? 'text-green-600'
          : 'text-yellow-500',
      icon: '📅',
    },
    {
      label: 'Evolução geral',
      valor:
        evolucao === null
          ? '—'
          : evolucao > 0
          ? `+${evolucao}%`
          : `${evolucao}%`,
      sub:
        evolucao === null
          ? mediaAtual !== null
            ? 'Sem dados do mês anterior'
            : 'Sem avaliações este mês'
          : evolucao > 0
          ? 'Score médio subiu este mês'
          : evolucao < 0
          ? 'Score médio caiu este mês'
          : 'Sem variação este mês',
      cor:
        evolucao === null
          ? 'text-gray-400'
          : evolucao > 0
          ? 'text-green-600'
          : evolucao < 0
          ? 'text-red-500'
          : 'text-gray-500',
      icon: '📈',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-8">

        {/* ── Header ── */}
        <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 px-6 py-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {getSaudacao()}, {nomeUsuario} 👋
              </h1>
              <p className="text-gray-500 mt-1 text-sm sm:text-base">
                Sua equipe está evoluindo hoje.
              </p>
            </div>
            <div className="hidden sm:flex items-center justify-center w-14 h-14 rounded-2xl bg-green-50 text-2xl flex-shrink-0">
              ⚽
            </div>
          </div>
        </div>

        {/* ── Cards de métricas ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-5 sm:p-6 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                  {card.label}
                </p>
                <span className="text-lg">{card.icon}</span>
              </div>
              <p className={`text-3xl sm:text-4xl font-bold leading-none ${card.cor}`}>
                {card.valor}
              </p>
              <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Alunos em risco ── */}
        {alertasRisco.length > 0 && (
          <div className="bg-red-50 rounded-[20px] border border-red-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-red-500 text-lg">⚠️</span>
                <h2 className="text-sm font-semibold text-gray-900">
                  Atletas em risco de evasão
                </h2>
              </div>
              <Link
                href="/alunos"
                className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
              >
                Ver todos →
              </Link>
            </div>
            <ul className="divide-y divide-red-100">
              {alertasRisco.map((aluno) => (
                <li key={aluno.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                    <span className="text-sm text-gray-800">{aluno.nome}</span>
                  </div>
                  <span className="text-sm font-bold text-red-500">
                    {aluno.frequencia}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Ações rápidas ── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">
            Ações rápidas
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {acoesRapidas.map((acao) => (
              <Link
                key={acao.href + acao.label}
                href={acao.href}
                className={`flex flex-col items-center justify-center gap-2 rounded-[20px] py-6 px-4 font-semibold text-sm transition-all shadow-sm active:scale-95 ${acao.bg} ${acao.text}`}
              >
                <span className="text-2xl">{acao.icon}</span>
                <span className="text-center leading-tight">{acao.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Lista de atletas ── */}
        {alunos && alunos.length > 0 && (
          <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Seus atletas</h2>
              <Link
                href="/alunos"
                className="text-xs text-green-600 hover:underline font-medium"
              >
                Ver todos →
              </Link>
            </div>
            <ul className="divide-y divide-gray-50">
              {alunos.slice(0, 8).map((aluno) => {
                const score = scorePorAluno.get(aluno.id) ?? null

                const scoreBadge =
                  score === null
                    ? null
                    : score >= 80
                    ? { label: 'Ótimo', cls: 'bg-green-100 text-green-700' }
                    : score >= 60
                    ? { label: 'Bom', cls: 'bg-blue-100 text-blue-700' }
                    : { label: 'Em risco', cls: 'bg-red-100 text-red-600' }

                return (
                  <li key={aluno.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          aluno.ativo ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      />
                      <span className="text-sm text-gray-800 truncate">{aluno.nome}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      {score !== null && (
                        <span className="text-xs font-semibold text-gray-500">
                          {score}
                        </span>
                      )}
                      {scoreBadge ? (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${scoreBadge.cls}`}
                        >
                          {scoreBadge.label}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">sem score</span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
            {alunos.length > 8 && (
              <p className="text-xs text-gray-400 text-center mt-3">
                +{alunos.length - 8} atleta{alunos.length - 8 > 1 ? 's' : ''} ·{' '}
                <Link href="/alunos" className="text-green-600 hover:underline">
                  ver todos
                </Link>
              </p>
            )}
          </div>
        )}

        {alunos?.length === 0 && (
          <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-12 text-center">
            <p className="text-4xl mb-3">⚽</p>
            <p className="text-gray-500 font-medium">Nenhum atleta cadastrado ainda.</p>
            <p className="text-gray-400 text-sm mt-1">
              Clique em{' '}
              <Link href="/alunos" className="text-green-600 hover:underline font-medium">
                Novo atleta
              </Link>{' '}
              para começar.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
