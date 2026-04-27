'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'

const CATEGORIAS = ['Sub-5', 'Sub-7', 'Sub-9', 'Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20', 'Adulto'] as const
type Categoria = (typeof CATEGORIAS)[number]

type AlunoResumido = { id: string; nome: string; ativo: boolean }
type Turma = { id: string; nome: string; categoria: string | null; alunos: AlunoResumido[] }

export default function TurmasPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [turmas, setTurmas] = useState<Turma[]>([])
  const [carregando, setCarregando] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState<Categoria>('Sub-11')
  const [salvando, setSalvando] = useState(false)
  const [deletando, setDeletando] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [expandida, setExpandida] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [authLoading, user, router])

  const carregarTurmas = useCallback(async () => {
    if (!user) return
    setCarregando(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('turmas')
      .select('id, nome, categoria, alunos(id, nome, ativo)')
      .eq('professor_id', user.id)
      .order('nome')
    setTurmas(
      (data ?? []).map((t) => ({
        ...t,
        alunos: Array.isArray(t.alunos) ? (t.alunos as AlunoResumido[]) : [],
      }))
    )
    setCarregando(false)
  }, [user])

  useEffect(() => {
    carregarTurmas()
  }, [carregarTurmas])

  async function criarTurma() {
    if (!nome.trim() || !user) return
    setSalvando(true)
    setErro(null)
    const supabase = createClient()
    const { error } = await supabase.from('turmas').insert({
      nome: nome.trim(),
      categoria,
      professor_id: user.id,
    })
    if (error) {
      setErro('Erro ao criar turma. Tente novamente.')
    } else {
      setModalAberto(false)
      setNome('')
      setCategoria('Sub-11')
      await carregarTurmas()
    }
    setSalvando(false)
  }

  async function deletarTurma(id: string, nomeTurma: string) {
    if (!confirm(`Deletar a turma "${nomeTurma}"? Esta ação não pode ser desfeita.`)) return
    setDeletando(id)
    const supabase = createClient()
    await supabase.from('turmas').delete().eq('id', id)
    setTurmas((prev) => prev.filter((t) => t.id !== id))
    setDeletando(null)
  }

  if (authLoading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Carregando...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">

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
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            + Nova equipe
          </button>
        </div>

        {/* Lista */}
        {carregando ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-12 text-center">
            <p className="text-gray-400 text-sm">Carregando...</p>
          </div>
        ) : turmas.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-12 text-center">
            <p className="text-gray-400 text-sm">Nenhuma equipe cadastrada.</p>
            <p className="text-xs text-gray-300 mt-1">Crie sua primeira equipe para começar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {turmas.map((turma) => {
              const isExpanded = expandida === turma.id
              const ativos = turma.alunos.filter((a) => a.ativo)

              return (
                <div
                  key={turma.id}
                  className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden"
                >
                  {/* Header da turma */}
                  <div className="px-6 py-4 flex items-center justify-between gap-4">
                    <button
                      className="flex-1 text-left"
                      onClick={() => setExpandida(isExpanded ? null : turma.id)}
                    >
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">{turma.nome}</p>
                        {turma.categoria && (
                          <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">
                            {turma.categoria}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {turma.alunos.length} atleta{turma.alunos.length !== 1 ? 's' : ''}
                          {ativos.length !== turma.alunos.length && ` (${ativos.length} ativo${ativos.length !== 1 ? 's' : ''})`}
                        </span>
                      </div>
                    </button>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <button
                        onClick={() => setExpandida(isExpanded ? null : turma.id)}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {isExpanded ? '▲' : '▼'}
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

                  {/* Lista de atletas (expandida) */}
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
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                      aluno.ativo ? 'bg-green-500' : 'bg-gray-300'
                                    }`}
                                  />
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

      {/* Modal nova equipe */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Nova equipe</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Turma A manhã"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  onKeyDown={(e) => e.key === 'Enter' && criarTurma()}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as Categoria)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {erro && <p className="text-sm text-red-500 mt-3">{erro}</p>}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setModalAberto(false); setNome(''); setErro(null) }}
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
