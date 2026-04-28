'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'

// ── Types ─────────────────────────────────────────────────────────────────────

type Turma = { id: string; nome: string }
type Aluno  = { id: string; nome: string; posicao: string | null }
type Status = 'presente' | 'falta'

// ── Helpers ───────────────────────────────────────────────────────────────────

const HOJE = new Date().toISOString().split('T')[0]

const dataFormatada = (() => {
  const s = new Date(HOJE + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
  return s.charAt(0).toUpperCase() + s.slice(1)
})()

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map((n) => n[0] ?? '').join('').toUpperCase()
}

function avatarBg(nome: string) {
  const colors = ['bg-green-500','bg-blue-500','bg-purple-500','bg-orange-500','bg-teal-500','bg-pink-500','bg-indigo-500','bg-amber-500']
  let h = 0
  for (const c of nome) h = (h * 31 + c.charCodeAt(0)) % colors.length
  return colors[h]
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PresencasPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [turmas,           setTurmas]           = useState<Turma[]>([])
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>('')
  const [alunos,           setAlunos]           = useState<Aluno[]>([])
  const [marcacoes,        setMarcacoes]        = useState<Record<string, Status>>({})
  const [carregando,       setCarregando]       = useState(false)
  const [salvandoTudo,     setSalvandoTudo]     = useState(false)
  const [salvoOk,          setSalvoOk]          = useState(false)

  // ── Auth ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [authLoading, user, router])

  // ── Load turmas ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return
    createClient()
      .from('turmas').select('id, nome').eq('professor_id', user.id).order('nome')
      .then(({ data }) => {
        const lista = data ?? []
        setTurmas(lista)
        if (lista.length > 0) setTurmaSelecionada(lista[0].id)
      })
  }, [user])

  // ── Load alunos + today's records ─────────────────────────────────────────

  const carregarDados = useCallback(async () => {
    if (!turmaSelecionada || !user) return
    setCarregando(true)
    const supabase = createClient()

    const { data: dadosAlunos } = await supabase
      .from('alunos')
      .select('id, nome, posicao')
      .eq('turma_id', turmaSelecionada)
      .eq('professor_id', user.id)
      .eq('ativo', true)
      .order('nome')

    const lista = dadosAlunos ?? []
    setAlunos(lista)

    if (!lista.length) { setMarcacoes({}); setCarregando(false); return }

    const ids = lista.map((a) => a.id)

    const { data: dadosHoje } = await supabase
      .from('presencas')
      .select('aluno_id, presente')
      .in('aluno_id', ids)
      .eq('data', HOJE)

    const mapa: Record<string, Status> = {}
    for (const p of dadosHoje ?? []) {
      mapa[p.aluno_id] = p.presente ? 'presente' : 'falta'
    }
    setMarcacoes(mapa)
    setCarregando(false)
  }, [turmaSelecionada, user])

  useEffect(() => { carregarDados() }, [carregarDados])

  // ── Derived counts ────────────────────────────────────────────────────────

  const countPresente = Object.values(marcacoes).filter((v) => v === 'presente').length
  const countFalta    = Object.values(marcacoes).filter((v) => v === 'falta').length
  const totalMarcados = Object.keys(marcacoes).length
  const semRegistro   = alunos.length - totalMarcados
  const todosMarcados = alunos.length > 0 && totalMarcados === alunos.length

  // ── Actions ───────────────────────────────────────────────────────────────

  function marcar(alunoId: string, status: Status) {
    setMarcacoes((prev) => {
      if (prev[alunoId] === status) {
        const next = { ...prev }
        delete next[alunoId]
        return next
      }
      return { ...prev, [alunoId]: status }
    })
    setSalvoOk(false)
  }

  function marcarTodos() {
    const todos: Record<string, Status> = {}
    for (const a of alunos) todos[a.id] = 'presente'
    setMarcacoes(todos)
    setSalvoOk(false)
  }

  function limpar() {
    setMarcacoes({})
    setSalvoOk(false)
  }

  async function salvarTudo() {
    if (!todosMarcados) return
    setSalvandoTudo(true)
    const supabase = createClient()

    const ids = alunos.map((a) => a.id)

    const { data: existentes } = await supabase
      .from('presencas')
      .select('id, aluno_id')
      .in('aluno_id', ids)
      .eq('data', HOJE)

    const existMap: Record<string, string> = {}
    for (const r of existentes ?? []) existMap[r.aluno_id] = r.id

    const updates: PromiseLike<unknown>[] = []

    for (const aluno of alunos) {
      const status = marcacoes[aluno.id]
      if (!status) continue
      const presente = status === 'presente'

      if (existMap[aluno.id]) {
        updates.push(
          supabase.from('presencas')
            .update({ presente })
            .eq('id', existMap[aluno.id])
            .then((r) => r)
        )
      } else {
        updates.push(
          supabase.from('presencas')
            .insert({ aluno_id: aluno.id, data: HOJE, presente })
            .then((r) => r)
        )
      }
    }

    await Promise.all(updates)
    setSalvandoTudo(false)
    setSalvoOk(true)
    setTimeout(() => setSalvoOk(false), 3000)
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
    <main className="min-h-screen bg-gray-50 pb-32">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── Header ── */}
        <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm px-6 py-5">
          <h1 className="text-2xl font-bold text-gray-900">Ficha de Presença</h1>
          <p className="text-sm text-gray-400 mt-1">{dataFormatada}</p>
        </div>

        {/* ── Seletor de equipe ── */}
        {turmas.length === 0 ? (
          <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm p-8 text-center">
            <p className="text-gray-400 text-sm">Nenhuma equipe cadastrada.</p>
            <p className="text-gray-400 text-xs mt-1">Crie equipes primeiro para registrar presenças.</p>
          </div>
        ) : (
          <select
            value={turmaSelecionada}
            onChange={(e) => setTurmaSelecionada(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-[20px] text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
          >
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>
        )}

        {/* ── Stat cards ── */}
        {turmaSelecionada && !carregando && alunos.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{countPresente}</p>
              <p className="text-xs text-gray-400 mt-1 font-medium">✅ Presentes</p>
            </div>
            <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-red-500">{countFalta}</p>
              <p className="text-xs text-gray-400 mt-1 font-medium">❌ Faltas</p>
            </div>
          </div>
        )}

        {/* ── Ações rápidas ── */}
        {turmaSelecionada && !carregando && alunos.length > 0 && (
          <div className="flex gap-3">
            <button
              onClick={marcarTodos}
              className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              ✅ Todos presentes
            </button>
            <button
              onClick={limpar}
              className="px-5 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl transition-colors shadow-sm"
            >
              Limpar
            </button>
          </div>
        )}

        {/* ── Lista de atletas ── */}
        {turmaSelecionada && (
          <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden">
            {carregando ? (
              <div className="py-16 text-center">
                <p className="text-gray-400 text-sm">Carregando atletas...</p>
              </div>
            ) : alunos.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-gray-400 text-sm">Nenhum atleta ativo nesta equipe.</p>
              </div>
            ) : (
              <>
                <div className="px-5 py-3 border-b border-gray-50">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {alunos.length} atleta{alunos.length !== 1 ? 's' : ''} · {totalMarcados} marcado{totalMarcados !== 1 ? 's' : ''}
                  </span>
                </div>
                <ul className="divide-y divide-gray-50">
                  {alunos.map((aluno) => {
                    const status = marcacoes[aluno.id] ?? null

                    return (
                      <li key={aluno.id} className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${avatarBg(aluno.nome)}`}>
                            {getInitials(aluno.nome)}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{aluno.nome}</p>
                            {aluno.posicao && (
                              <p className="text-xs text-gray-400 mt-0.5">{aluno.posicao}</p>
                            )}
                          </div>
                        </div>

                        {/* Botões de status */}
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => marcar(aluno.id, 'presente')}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                              status === 'presente'
                                ? 'bg-green-500 text-white shadow-sm scale-[1.02]'
                                : 'bg-gray-50 text-gray-500 hover:bg-green-50 hover:text-green-600 border border-gray-100'
                            }`}
                          >
                            ✅ Presente
                          </button>
                          <button
                            onClick={() => marcar(aluno.id, 'falta')}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                              status === 'falta'
                                ? 'bg-red-500 text-white shadow-sm scale-[1.02]'
                                : 'bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-500 border border-gray-100'
                            }`}
                          >
                            ❌ Faltou
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Rodapé fixo ── */}
      {turmaSelecionada && !carregando && alunos.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg px-4 py-4 space-y-3 z-40 md:left-56">
          {/* Aviso atletas sem registro */}
          {semRegistro > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-center">
              <p className="text-sm font-medium text-amber-700">
                ⚠️ {semRegistro} atleta{semRegistro !== 1 ? 's' : ''} sem registro ainda
              </p>
            </div>
          )}

          {/* Botão salvar */}
          {salvoOk ? (
            <div className="w-full py-3.5 rounded-[20px] bg-green-50 border border-green-200 text-green-700 text-sm font-semibold text-center">
              ✅ Presença salva com sucesso!
            </div>
          ) : (
            <button
              onClick={salvarTudo}
              disabled={!todosMarcados || salvandoTudo}
              className="w-full py-3.5 rounded-[20px] text-sm font-bold transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white"
            >
              {salvandoTudo
                ? 'Salvando...'
                : `Salvar presença — ${totalMarcados}/${alunos.length} registrados`}
            </button>
          )}
        </div>
      )}
    </main>
  )
}
