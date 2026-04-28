'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'

// ── Types ────────────────────────────────────────────────────────────────────

type Aluno = {
  id: string
  nome: string
  posicao: string | null
  responsavel: string | null
  ativo: boolean
  turma_id: string | null
  data_nascimento: string | null
  turmas: { nome: string } | null
  frequenciaMes: number | null
  scoutScore: number | null // 0–100 stored in DB
}

type Turma = {
  id: string
  nome: string
  categoria: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const formVazio = {
  nome: '',
  posicao: '',
  turma_id: '',
  responsavel: '',
  telefone: '',
  data_nascimento: '',
}

function calcularIdade(dataNasc: string): number | null {
  if (!dataNasc) return null
  const hoje = new Date()
  const nasc = new Date(dataNasc + 'T12:00:00')
  let idade = hoje.getFullYear() - nasc.getFullYear()
  if (
    hoje.getMonth() < nasc.getMonth() ||
    (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate())
  ) idade--
  return idade >= 0 ? idade : null
}

function categoriaParaIdade(idade: number): string {
  if (idade <= 5) return 'Sub-5'
  if (idade <= 7) return 'Sub-7'
  if (idade <= 9) return 'Sub-9'
  if (idade <= 11) return 'Sub-11'
  if (idade <= 13) return 'Sub-13'
  if (idade <= 15) return 'Sub-15'
  if (idade <= 17) return 'Sub-17'
  if (idade <= 20) return 'Sub-20'
  return 'Adulto'
}

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map((n) => n[0] ?? '').join('').toUpperCase()
}

function avatarBg(nome: string) {
  const colors = ['bg-green-500','bg-blue-500','bg-purple-500','bg-orange-500','bg-teal-500','bg-pink-500','bg-indigo-500','bg-amber-500']
  let h = 0
  for (const c of nome) h = (h * 31 + c.charCodeAt(0)) % colors.length
  return colors[h]
}

type StatusKey = 'otimo' | 'bom' | 'risco'

function calcStatus(score: number | null, freq: number | null): StatusKey | null {
  const scoreS: StatusKey | null = score === null ? null : score >= 80 ? 'otimo' : score >= 60 ? 'bom' : 'risco'
  const freqS: StatusKey | null  = freq  === null ? null : freq  >= 90 ? 'otimo' : freq  >= 75 ? 'bom' : 'risco'
  const all = [scoreS, freqS].filter(Boolean) as StatusKey[]
  if (!all.length) return null
  if (all.includes('risco')) return 'risco'
  if (all.includes('bom'))   return 'bom'
  return 'otimo'
}

const STATUS_CFG: Record<StatusKey, { label: string; cls: string }> = {
  otimo: { label: 'Ótimo',    cls: 'bg-green-100 text-green-700' },
  bom:   { label: 'Bom',      cls: 'bg-blue-100  text-blue-700'  },
  risco: { label: 'Em risco', cls: 'bg-red-100   text-red-600'   },
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AlunosPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [alunos,      setAlunos]      = useState<Aluno[]>([])
  const [turmas,      setTurmas]      = useState<Turma[]>([])
  const [busca,       setBusca]       = useState('')
  const [filtroTurma, setFiltroTurma] = useState('')
  const [carregando,  setCarregando]  = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando,    setSalvando]    = useState(false)
  const [erro,        setErro]        = useState<string | null>(null)
  const [form,        setForm]        = useState(formVazio)

  const idadeCalculada  = calcularIdade(form.data_nascimento)
  const categoriaSugerida = idadeCalculada !== null ? categoriaParaIdade(idadeCalculada) : null

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchAlunos = useCallback(async () => {
    if (!user) return
    const supabase = createClient()

    // 1. Alunos
    const { data: rawAlunos } = await supabase
      .from('alunos')
      .select('id, nome, posicao, responsavel, ativo, turma_id, data_nascimento, turmas(nome)')
      .eq('professor_id', user.id)
      .order('nome')

    const alunosList = (rawAlunos ?? []).map((a) => ({
      ...a,
      turmas: Array.isArray(a.turmas) ? (a.turmas[0] ?? null) : (a.turmas ?? null),
      frequenciaMes: null as number | null,
      scoutScore:    null as number | null,
    })) as Aluno[]

    if (!alunosList.length) { setAlunos([]); setCarregando(false); return }

    const ids = alunosList.map((a) => a.id)

    // 2. Presença do mês atual
    const agora = new Date()
    const primeiroDia = new Date(agora.getFullYear(), agora.getMonth(), 1)
      .toISOString().split('T')[0]

    const { data: presencas } = await supabase
      .from('presencas')
      .select('aluno_id, presente, data')
      .in('aluno_id', ids)
      .gte('data', primeiroDia)

    // 3. Avaliações (scout_score)
    const { data: avaliacoes } = await supabase
      .from('avaliacoes')
      .select('aluno_id, scout_score')
      .in('aluno_id', ids)

    // 4. Enrich
    const enriched = alunosList.map((a) => {
      const preMes = (presencas ?? []).filter((p) => p.aluno_id === a.id)
      const freq = preMes.length
        ? Math.round((preMes.filter((p) => p.presente).length / preMes.length) * 100)
        : null

      const scores = (avaliacoes ?? [])
        .filter((av) => av.aluno_id === a.id && av.scout_score != null)
        .map((av) => av.scout_score as number)
      const score = scores.length
        ? Math.round(scores.reduce((x, y) => x + y, 0) / scores.length)
        : null

      return { ...a, frequenciaMes: freq, scoutScore: score }
    })

    setAlunos(enriched)
    setCarregando(false)
  }, [user])

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return }
    if (!user) return
    fetchAlunos()
    const supabase = createClient()
    supabase.from('turmas').select('id, nome, categoria').eq('professor_id', user.id).order('nome')
      .then(({ data }) => setTurmas(data ?? []))
  }, [user, authLoading, router, fetchAlunos])

  // ── Actions ────────────────────────────────────────────────────────────────

  async function salvarAluno(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSalvando(true); setErro(null)
    const supabase = createClient()

    const { data: lastAluno } = await supabase
      .from('alunos').select('scout_id').like('scout_id', 'SID-%')
      .order('scout_id', { ascending: false }).limit(1).single()

    let nextNum = 1
    if (lastAluno?.scout_id) {
      const match = lastAluno.scout_id.match(/SID-(\d+)/)
      if (match) nextNum = parseInt(match[1]) + 1
    }
    const scout_id = `SID-${String(nextNum).padStart(5, '0')}`

    const { error } = await supabase.from('alunos').insert({
      nome: form.nome.trim(),
      posicao: form.posicao.trim() || null,
      turma_id: form.turma_id || null,
      responsavel: form.responsavel.trim() || null,
      telefone: form.telefone.trim() || null,
      data_nascimento: form.data_nascimento || null,
      professor_id: user.id,
      ativo: true,
      scout_id,
    })

    if (error) { setErro(`Erro ao salvar: ${error.message}`); setSalvando(false); return }
    setForm(formVazio); setModalAberto(false); setSalvando(false)
    fetchAlunos()
  }

  function fecharModal() { setModalAberto(false); setErro(null); setForm(formVazio) }

  // ── Filter ─────────────────────────────────────────────────────────────────

  const alunosFiltrados = alunos.filter((a) => {
    const okBusca = a.nome.toLowerCase().includes(busca.toLowerCase())
    const okTurma = !filtroTurma || a.turma_id === filtroTurma
    return okBusca && okTurma
  })

  // ── Loading ────────────────────────────────────────────────────────────────

  if (authLoading || carregando) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Carregando...</p>
      </main>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Atletas</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {alunos.length} atleta{alunos.length !== 1 ? 's' : ''} cadastrado{alunos.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setModalAberto(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            + Novo atleta
          </button>
        </div>

        {/* ── Filtros ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar atleta por nome..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
            />
          </div>
          <select
            value={filtroTurma}
            onChange={(e) => setFiltroTurma(e.target.value)}
            className="sm:w-52 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm text-gray-700"
          >
            <option value="">Todas as equipes</option>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>
        </div>

        {/* ── Tabela (desktop) ── */}
        {alunosFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
            <p className="text-gray-400 text-sm">
              {busca || filtroTurma ? 'Nenhum atleta encontrado com esses filtros.' : 'Nenhum atleta cadastrado ainda.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-6 py-3.5">Atleta</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3.5">Equipe</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3.5">Frequência</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3.5">Scout Score</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {alunosFiltrados.map((aluno) => {
                    const idade    = calcularIdade(aluno.data_nascimento ?? '')
                    const status   = calcStatus(aluno.scoutScore, aluno.frequenciaMes)
                    const sbadge   = status ? STATUS_CFG[status] : null
                    const scoreDisp = aluno.scoutScore !== null
                      ? (aluno.scoutScore / 10).toFixed(1)
                      : null

                    return (
                      <tr
                        key={aluno.id}
                        onClick={() => router.push(`/alunos/${aluno.id}`)}
                        className="hover:bg-green-50/40 cursor-pointer transition-colors group"
                      >
                        {/* Atleta */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${avatarBg(aluno.nome)}`}>
                              {getInitials(aluno.nome)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-gray-900 truncate">{aluno.nome}</p>
                                {!aluno.ativo && (
                                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400 font-medium flex-shrink-0">Inativo</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {[aluno.posicao, idade !== null ? `${idade} anos` : null].filter(Boolean).join(' · ')}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Equipe */}
                        <td className="px-4 py-4">
                          {aluno.turmas?.nome ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-semibold border border-green-100">
                              {aluno.turmas.nome}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>

                        {/* Frequência */}
                        <td className="px-4 py-4">
                          {aluno.frequenciaMes !== null ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-1.5 rounded-full ${aluno.frequenciaMes >= 75 ? 'bg-green-500' : 'bg-red-400'}`}
                                  style={{ width: `${aluno.frequenciaMes}%` }}
                                />
                              </div>
                              <span className={`text-sm font-semibold ${aluno.frequenciaMes >= 90 ? 'text-green-600' : aluno.frequenciaMes >= 75 ? 'text-gray-700' : 'text-red-500'}`}>
                                {aluno.frequenciaMes}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>

                        {/* Scout Score */}
                        <td className="px-4 py-4">
                          {scoreDisp !== null ? (
                            <span className={`text-sm font-bold ${aluno.scoutScore! >= 80 ? 'text-green-600' : aluno.scoutScore! >= 60 ? 'text-blue-600' : 'text-red-500'}`}>
                              {scoreDisp}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          {sbadge ? (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${sbadge.cls}`}>
                              {sbadge.label}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>

                        {/* Chevron */}
                        <td className="px-4 py-4">
                          <svg className="w-4 h-4 text-gray-300 group-hover:text-green-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {alunosFiltrados.map((aluno) => {
                const idade   = calcularIdade(aluno.data_nascimento ?? '')
                const status  = calcStatus(aluno.scoutScore, aluno.frequenciaMes)
                const sbadge  = status ? STATUS_CFG[status] : null
                const scoreDisp = aluno.scoutScore !== null
                  ? (aluno.scoutScore / 10).toFixed(1)
                  : null

                return (
                  <div
                    key={aluno.id}
                    onClick={() => router.push(`/alunos/${aluno.id}`)}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 cursor-pointer active:scale-[0.99] transition-transform"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${avatarBg(aluno.nome)}`}>
                        {getInitials(aluno.nome)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900 truncate">{aluno.nome}</p>
                          {!aluno.ativo && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">Inativo</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {[aluno.posicao, idade !== null ? `${idade} anos` : null].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {aluno.turmas?.nome && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-green-50 text-green-700 text-xs font-semibold border border-green-100">
                          {aluno.turmas.nome}
                        </span>
                      )}
                      {aluno.frequenciaMes !== null && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${aluno.frequenciaMes >= 75 ? 'bg-gray-50 text-gray-600' : 'bg-red-50 text-red-500'}`}>
                          {aluno.frequenciaMes}% freq.
                        </span>
                      )}
                      {scoreDisp !== null && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${aluno.scoutScore! >= 80 ? 'bg-green-50 text-green-700' : aluno.scoutScore! >= 60 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-600'}`}>
                          Score {scoreDisp}
                        </span>
                      )}
                      {sbadge && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sbadge.cls}`}>
                          {sbadge.label}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Footer count */}
        {alunosFiltrados.length > 0 && (
          <p className="text-xs text-gray-400 text-center pb-2">
            Exibindo {alunosFiltrados.length} de {alunos.length} atleta{alunos.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* ── Modal novo atleta ── */}
      {modalAberto && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) fecharModal() }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Novo atleta</h2>
              <button onClick={fecharModal} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            <form onSubmit={salvarAluno} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  required type="text" value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Nome do atleta"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Data de nascimento</label>
                <input
                  type="date" value={form.data_nascimento}
                  onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  max={new Date().toISOString().split('T')[0]}
                />
                {idadeCalculada !== null && categoriaSugerida && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-xs text-gray-500">{idadeCalculada} ano{idadeCalculada !== 1 ? 's' : ''}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">⚽ {categoriaSugerida}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Posição</label>
                <input
                  type="text" value={form.posicao}
                  onChange={(e) => setForm({ ...form, posicao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: Atacante, Goleiro, Zagueiro..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Equipe
                  {categoriaSugerida && turmas.some((t) => t.categoria === categoriaSugerida) && (
                    <span className="ml-1.5 text-green-600 font-normal">(sugerido: {categoriaSugerida})</span>
                  )}
                </label>
                {turmas.length > 0 ? (
                  <select
                    value={form.turma_id}
                    onChange={(e) => setForm({ ...form, turma_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Sem equipe</option>
                    {turmas.map((t) => (
                      <option key={t.id} value={t.id}>{t.nome}{t.categoria ? ` (${t.categoria})` : ''}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-gray-400 py-2">Nenhuma equipe cadastrada. Crie equipes primeiro.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Responsável</label>
                <input
                  type="text" value={form.responsavel}
                  onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Nome do responsável"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Telefone</label>
                <input
                  type="tel" value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="(11) 99999-9999"
                />
              </div>

              {erro && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button" onClick={fecharModal}
                  className="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit" disabled={salvando}
                  className="flex-1 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg transition-colors"
                >
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
