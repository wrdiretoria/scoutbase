'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'

type Turma = { id: string; nome: string }

type Aluno = { id: string; nome: string; posicao: string | null }

type PresencaRegistro = { id: string; presente: boolean }

type FrequenciaAluno = { total: number; presentes: number; pct: number }

const HOJE = new Date().toISOString().split('T')[0]

export default function PresencasPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [turmas, setTurmas] = useState<Turma[]>([])
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>('')
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [presencasHoje, setPresencasHoje] = useState<Record<string, PresencaRegistro>>({})
  const [frequencias, setFrequencias] = useState<Record<string, FrequenciaAluno>>({})
  const [salvando, setSalvando] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  // Redireciona se não autenticado
  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [authLoading, user, router])

  // Carrega turmas
  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    supabase
      .from('turmas')
      .select('id, nome')
      .eq('professor_id', user.id)
      .order('nome')
      .then(({ data }) => {
        const lista = data ?? []
        setTurmas(lista)
        if (lista.length > 0) setTurmaSelecionada(lista[0].id)
      })
  }, [user])

  const carregarDados = useCallback(async () => {
    if (!turmaSelecionada || !user) return
    setCarregando(true)

    const supabase = createClient()

    // Alunos da turma selecionada
    const { data: dadosAlunos } = await supabase
      .from('alunos')
      .select('id, nome, posicao')
      .eq('turma_id', turmaSelecionada)
      .eq('professor_id', user.id)
      .eq('ativo', true)
      .order('nome')

    const lista = dadosAlunos ?? []
    setAlunos(lista)

    if (lista.length === 0) {
      setPresencasHoje({})
      setFrequencias({})
      setCarregando(false)
      return
    }

    const ids = lista.map((a) => a.id)

    // Presenças de HOJE
    const { data: dadosHoje } = await supabase
      .from('presencas')
      .select('id, aluno_id, presente')
      .in('aluno_id', ids)
      .eq('data', HOJE)

    const mapa: Record<string, PresencaRegistro> = {}
    for (const p of dadosHoje ?? []) {
      mapa[p.aluno_id] = { id: p.id, presente: p.presente }
    }
    setPresencasHoje(mapa)

    // Todas as presenças para calcular frequência
    const { data: todasPresencas } = await supabase
      .from('presencas')
      .select('aluno_id, presente')
      .in('aluno_id', ids)

    const freqMap: Record<string, FrequenciaAluno> = {}
    for (const id of ids) {
      const registros = (todasPresencas ?? []).filter((p) => p.aluno_id === id)
      const total = registros.length
      const presentes = registros.filter((p) => p.presente).length
      freqMap[id] = { total, presentes, pct: total > 0 ? Math.round((presentes / total) * 100) : 0 }
    }
    setFrequencias(freqMap)

    setCarregando(false)
  }, [turmaSelecionada, user])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  async function marcarPresenca(alunoId: string, presente: boolean) {
    setSalvando(alunoId)
    const supabase = createClient()
    const registroExistente = presencasHoje[alunoId]

    if (registroExistente) {
      await supabase
        .from('presencas')
        .update({ presente })
        .eq('id', registroExistente.id)
      setPresencasHoje((prev) => ({ ...prev, [alunoId]: { ...registroExistente, presente } }))
    } else {
      const { data } = await supabase
        .from('presencas')
        .insert({ aluno_id: alunoId, data: HOJE, presente })
        .select('id')
        .single()
      if (data) {
        setPresencasHoje((prev) => ({ ...prev, [alunoId]: { id: data.id, presente } }))
      }
    }

    // Atualiza frequência local
    setFrequencias((prev) => {
      const atual = prev[alunoId]
      if (!atual) return prev
      const foiMarcadoAntes = registroExistente !== undefined
      const eraPresenteAntes = registroExistente?.presente ?? false

      let novoTotal = atual.total
      let novosPresentes = atual.presentes

      if (!foiMarcadoAntes) {
        novoTotal += 1
        if (presente) novosPresentes += 1
      } else {
        if (eraPresenteAntes && !presente) novosPresentes -= 1
        if (!eraPresenteAntes && presente) novosPresentes += 1
      }

      return {
        ...prev,
        [alunoId]: {
          total: novoTotal,
          presentes: novosPresentes,
          pct: novoTotal > 0 ? Math.round((novosPresentes / novoTotal) * 100) : 0,
        },
      }
    })

    setSalvando(null)
  }

  if (authLoading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Carregando...</p>
      </main>
    )
  }

  const alunosEmRisco = alunos.filter((a) => {
    const f = frequencias[a.id]
    return f && f.total > 0 && f.pct < 70
  })

  const dataFormatada = new Date(HOJE + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Presenças</h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">{dataFormatada}</p>
        </div>

        {/* Seletor de turma */}
        {turmas.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="text-gray-400 text-sm">Nenhuma turma cadastrada.</p>
            <p className="text-gray-400 text-xs mt-1">Crie turmas primeiro para registrar presenças.</p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Turma:</label>
            <select
              value={turmaSelecionada}
              onChange={(e) => setTurmaSelecionada(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </div>
        )}

        {/* Lista de alunos */}
        {turmaSelecionada && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {carregando ? (
              <div className="py-12 text-center">
                <p className="text-gray-400 text-sm">Carregando alunos...</p>
              </div>
            ) : alunos.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-400 text-sm">Nenhum aluno nesta turma.</p>
              </div>
            ) : (
              <>
                <div className="px-6 py-3 border-b border-gray-50 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {alunos.length} aluno{alunos.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs text-gray-400">
                    {Object.keys(presencasHoje).length} marcado{Object.keys(presencasHoje).length !== 1 ? 's' : ''}
                  </span>
                </div>
                <ul className="divide-y divide-gray-50">
                  {alunos.map((aluno) => {
                    const registro = presencasHoje[aluno.id]
                    const freq = frequencias[aluno.id]
                    const marcado = registro !== undefined
                    const estaPresente = registro?.presente ?? false
                    const emRisco = freq && freq.total > 0 && freq.pct < 70

                    return (
                      <li key={aluno.id} className="px-6 py-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 truncate">{aluno.nome}</p>
                              {emRisco && (
                                <span className="flex-shrink-0 text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium">
                                  Risco
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {aluno.posicao && (
                                <p className="text-xs text-gray-400">{aluno.posicao}</p>
                              )}
                              {freq && freq.total > 0 && (
                                <span className={`text-xs font-medium ${
                                  freq.pct >= 70 ? 'text-green-600' : 'text-red-500'
                                }`}>
                                  {freq.pct}% frequência
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Botão Falta */}
                            <button
                              onClick={() => marcarPresenca(aluno.id, false)}
                              disabled={salvando === aluno.id}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                marcado && !estaPresente
                                  ? 'bg-red-500 text-white shadow-sm'
                                  : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500'
                              } disabled:opacity-50`}
                            >
                              Falta
                            </button>

                            {/* Botão Presente */}
                            <button
                              onClick={() => marcarPresenca(aluno.id, true)}
                              disabled={salvando === aluno.id}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                marcado && estaPresente
                                  ? 'bg-green-500 text-white shadow-sm'
                                  : 'bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600'
                              } disabled:opacity-50`}
                            >
                              {salvando === aluno.id ? '...' : 'Presente'}
                            </button>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
          </div>
        )}

        {/* Alunos em risco */}
        {alunosEmRisco.length > 0 && !carregando && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-red-700 mb-3">
              Alunos em risco — frequência abaixo de 70%
            </h2>
            <ul className="space-y-2">
              {alunosEmRisco.map((aluno) => {
                const freq = frequencias[aluno.id]
                return (
                  <li key={aluno.id} className="flex items-center justify-between">
                    <span className="text-sm text-red-800">{aluno.nome}</span>
                    <span className="text-sm font-bold text-red-600">{freq?.pct}%</span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </main>
  )
}
