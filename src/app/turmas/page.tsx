'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'
import EmptyState from '@/components/EmptyState'

// ── Types ─────────────────────────────────────────────────────────────────────

const CATEGORIAS = ['Sub-5', 'Sub-7', 'Sub-9', 'Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20', 'Adulto'] as const
type Categoria = (typeof CATEGORIAS)[number]

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const

type AlunoResumido = { id: string; nome: string; ativo: boolean }

type Turma = {
  id: string
  nome: string
  categoria: string | null
  dias_semana: string | null
  horario: string | null
  alunos: AlunoResumido[]
  freqMedia: number | null
  scoreMedia: number | null // 0–100 from DB, display ÷ 10
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TurmasPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [turmas,     setTurmas]     = useState<Turma[]>([])
  const [carregando, setCarregando] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [expandida,  setExpandida]  = useState<string | null>(null)
  const [deletando,  setDeletando]  = useState<string | null>(null)
  const [salvando,   setSalvando]   = useState(false)
  const [erro,       setErro]       = useState<string | null>(null)

  // Form state
  const [nome,          setNome]          = useState('')
  const [categoria,     setCategoria]     = useState<Categoria>('Sub-11')
  const [diasSel,       setDiasSel]       = useState<string[]>([])
  const [horario,       setHorario]       = useState('')

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [authLoading, user, router])

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const carregarTurmas = useCallback(async () => {
    if (!user) return
    setCarregando(true)
    const supabase = createClient()

    const { data } = await supabase
      .from('turmas')
      .select('id, nome, categoria, dias_semana, horario, alunos(id, nome, ativo)')
      .eq('professor_id', user.id)
      .order('nome')

    const lista: Turma[] = (data ?? []).map((t) => ({
      ...t,
      dias_semana: (t as { dias_semana?: string | null }).dias_semana ?? null,
      horario:     (t as { horario?: string | null }).horario ?? null,
      alunos:      Array.isArray(t.alunos) ? (t.alunos as AlunoResumido[]) : [],
      freqMedia:   null,
      scoreMedia:  null,
    }))

    // Enrich with frequency + score
    const allIds = lista.flatMap((t) => t.alunos.map((a) => a.id))

    if (allIds.length > 0) {
      const agora = new Date()
      const primeiroDia = new Date(agora.getFullYear(), agora.getMonth(), 1)
        .toISOString().split('T')[0]

      const [{ data: presencas }, { data: avaliacoes }] = await Promise.all([
        supabase.from('presencas')
          .select('aluno_id, presente, data')
          .in('aluno_id', allIds)
          .gte('data', primeiroDia),
        supabase.from('avaliacoes')
          .select('aluno_id, scout_score')
          .in('aluno_id', allIds),
      ])

      for (const turma of lista) {
        const ids = turma.alunos.map((a) => a.id)

        // Frequency média do mês
        const freqs = ids
          .map((id) => {
            const p = (presencas ?? []).filter((x) => x.aluno_id === id)
            if (!p.length) return null
            return (p.filter((x) => x.presente).length / p.length) * 100
          })
          .filter((v): v is number => v !== null)
        turma.freqMedia = freqs.length
          ? Math.round(freqs.reduce((a, b) => a + b, 0) / freqs.length)
          : null

        // Score médio da equipe
        const scoresPorAluno = ids.map((id) => {
          const avs = (avaliacoes ?? []).filter(
            (x) => x.aluno_id === id && x.scout_score != null
          )
          if (!avs.length) return null
          return avs.reduce((s, x) => s + (x.scout_score as number), 0) / avs.length
        }).filter((v): v is number => v !== null)

        turma.scoreMedia = scoresPorAluno.length
          ? Math.round(scoresPorAluno.reduce((a, b) => a + b, 0) / scoresPorAluno.length)
          : null
      }
    }

    setTurmas(lista)
    setCarregando(false)
  }, [user])

  useEffect(() => { carregarTurmas() }, [carregarTurmas])

  // ── Actions ───────────────────────────────────────────────────────────────

  function toggleDia(dia: string) {
    setDiasSel((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    )
  }

  function fecharModal() {
    setModalAberto(false)
    setNome(''); setCategoria('Sub-11')
    setDiasSel([]); setHorario('')
    setErro(null)
  }

  async function criarTurma() {
    if (!nome.trim() || !user) return
    setSalvando(true); setErro(null)
    const supabase = createClient()

    // Preserves the weekday order (Seg before Ter, etc.)
    const diasOrdenados = DIAS_SEMANA.filter((d) => diasSel.includes(d))

    const { error } = await supabase.from('turmas').insert({
      nome: nome.trim(),
      categoria,
      dias_semana: diasOrdenados.length > 0 ? diasOrdenados.join('/') : null,
      horario: horario.trim() || null,
      professor_id: user.id,
    })

    if (error) {
      setErro('Erro ao criar equipe. Tente novamente.')
    } else {
      fecharModal()
      await carregarTurmas()
    }
    setSalvando(false)
  }

  async function deletarTurma(id: string, nomeTurma: string) {
    if (!confirm(`Deletar a equipe "${nomeTurma}"? Esta ação não pode ser desfeita.`)) return
    setDeletando(id)
    const supabase = createClient()
    await supabase.from('turmas').delete().eq('id', id)
    setTurmas((prev) => prev.filter((t) => t.id !== id))
    setDeletando(null)
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Carregando...</p>
      </main>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Equipes</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {turmas.length} equipe{turmas.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setModalAberto(true)}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
          >
            + Nova equipe
          </button>
        </div>

        {/* Lista */}
        {carregando ? (
          <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm py-12 text-center">
            <p className="text-gray-400 text-sm">Carregando...</p>
          </div>
        ) : turmas.length === 0 ? (
          <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm">
            <EmptyState
              icon="🏆"
              title="Nenhuma equipe criada."
              subtitle="Crie sua primeira equipe e organize seus atletas por categoria."
              action={{ label: '+ Nova equipe', onClick: () => setModalAberto(true) }}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {turmas.map((turma) => {
              const isExpanded = expandida === turma.id
              const ativos = turma.alunos.filter((a) => a.ativo)
              const scoreDisp = turma.scoreMedia !== null
                ? (turma.scoreMedia / 10).toFixed(1)
                : null

              // Schedule string
              const schedule = [
                turma.dias_semana,
                turma.horario,
              ].filter(Boolean).join(' • ')

              return (
                <div
                  key={turma.id}
                  className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden"
                >
                  {/* ── Card header ── */}
                  <div className="px-6 pt-5 pb-4">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: name + meta */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-base font-bold text-gray-900">{turma.nome}</p>
                          {turma.categoria && (
                            <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                              {turma.categoria}
                            </span>
                          )}
                        </div>
                        {schedule && (
                          <p className="text-xs text-gray-400 font-medium">{schedule}</p>
                        )}
                      </div>

                      {/* Right: actions */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <button
                          onClick={() => setExpandida(isExpanded ? null : turma.id)}
                          className="text-xs text-gray-400 hover:text-gray-600 transition-colors p-1"
                          title={isExpanded ? 'Recolher' : 'Ver atletas'}
                        >
                          {isExpanded ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => deletarTurma(turma.id, turma.nome)}
                          disabled={deletando === turma.id}
                          className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50 transition-colors"
                        >
                          {deletando === turma.id ? '...' : 'Deletar'}
                        </button>
                      </div>
                    </div>

                    {/* ── Stats row ── */}
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      {/* Atletas */}
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-xs text-gray-500 font-medium">
                          {turma.alunos.length} atleta{turma.alunos.length !== 1 ? 's' : ''}
                          {ativos.length !== turma.alunos.length && (
                            <span className="text-gray-400"> ({ativos.length} ativo{ativos.length !== 1 ? 's' : ''})</span>
                          )}
                        </span>
                      </div>

                      {/* Frequência */}
                      {turma.freqMedia !== null && (
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <span className={`text-xs font-semibold ${turma.freqMedia >= 75 ? 'text-green-600' : 'text-red-500'}`}>
                            {turma.freqMedia}% freq.
                          </span>
                        </div>
                      )}

                      {/* Scout Score */}
                      {scoreDisp !== null && (
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          <span className={`text-xs font-semibold ${turma.scoreMedia! >= 80 ? 'text-green-600' : turma.scoreMedia! >= 60 ? 'text-blue-600' : 'text-red-500'}`}>
                            {scoreDisp} score
                          </span>
                        </div>
                      )}
                    </div>

                    {/* ── Barra de frequência ── */}
                    {turma.freqMedia !== null && (
                      <div className="mt-3">
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all ${turma.freqMedia >= 75 ? 'bg-green-500' : 'bg-red-400'}`}
                            style={{ width: `${turma.freqMedia}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Toggle atletas */}
                    <button
                      onClick={() => setExpandida(isExpanded ? null : turma.id)}
                      className="mt-3 text-xs text-gray-400 hover:text-green-600 transition-colors font-medium"
                    >
                      {isExpanded ? '▲ Ocultar atletas' : `▼ Ver atletas`}
                    </button>
                  </div>

                  {/* ── Lista expandida ── */}
                  {isExpanded && (
                    <div className="border-t border-gray-50 px-6 py-3">
                      {turma.alunos.length === 0 ? (
                        <p className="text-xs text-gray-400 py-2">
                          Nenhum atleta vinculado.{' '}
                          <Link href="/alunos" className="text-green-600 hover:underline">
                            Cadastrar atleta →
                          </Link>
                        </p>
                      ) : (
                        <ul className="divide-y divide-gray-50">
                          {turma.alunos
                            .sort((a, b) => a.nome.localeCompare(b.nome))
                            .map((aluno) => (
                              <li key={aluno.id}>
                                <Link
                                  href={`/alunos/${aluno.id}`}
                                  className="flex items-center gap-2.5 py-2 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${aluno.ativo ? 'bg-green-500' : 'bg-gray-300'}`} />
                                  <span className="text-sm text-gray-700">{aluno.nome}</span>
                                  {!aluno.ativo && (
                                    <span className="text-xs text-gray-400">(inativo)</span>
                                  )}
                                </Link>
                              </li>
                            ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600 inline-flex items-center gap-1">
          ← Dashboard
        </Link>
      </div>

      {/* ── Modal nova equipe ── */}
      {modalAberto && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) fecharModal() }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Nova equipe</h2>
              <button onClick={fecharModal} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            <div className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Nome <span className="text-red-400">*</span>
                </label>
                <input
                  type="text" value={nome} autoFocus
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Sub-11 Manhã"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  onKeyDown={(e) => e.key === 'Enter' && criarTurma()}
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as Categoria)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Dias da semana */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Dias da semana</label>
                <div className="flex gap-2 flex-wrap">
                  {DIAS_SEMANA.map((dia) => (
                    <button
                      key={dia}
                      type="button"
                      onClick={() => toggleDia(dia)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        diasSel.includes(dia)
                          ? 'bg-green-600 border-green-600 text-white'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-green-300'
                      }`}
                    >
                      {dia}
                    </button>
                  ))}
                </div>
              </div>

              {/* Horário */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Horário</label>
                <input
                  type="text" value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  placeholder="Ex: 08h, 14h30"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {erro && <p className="text-sm text-red-500 mt-3">{erro}</p>}

            <div className="flex gap-3 mt-6">
              <button
                onClick={fecharModal}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={criarTurma}
                disabled={salvando || !nome.trim()}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                {salvando ? 'Criando...' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
