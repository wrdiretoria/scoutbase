'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase'

type Aluno = {
  id: string
  nome: string
  posicao: string | null
  responsavel: string | null
  ativo: boolean
  turma_id: string | null
  turmas: { nome: string } | null
}

type Turma = {
  id: string
  nome: string
  categoria: string | null
}

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
  ) {
    idade--
  }
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

export default function AlunosPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [form, setForm] = useState(formVazio)

  // Derived: age and suggested category from birth date
  const idadeCalculada = calcularIdade(form.data_nascimento)
  const categoriaSugerida =
    idadeCalculada !== null ? categoriaParaIdade(idadeCalculada) : null

  const fetchAlunos = useCallback(async () => {
    if (!user) return
    const supabase = createClient()
    const { data } = await supabase
      .from('alunos')
      .select('id, nome, posicao, responsavel, ativo, turma_id, turmas(nome)')
      .eq('professor_id', user.id)
      .order('nome')
    setAlunos(data ?? [])
    setCarregando(false)
  }, [user])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    if (!user) return

    fetchAlunos()

    const supabase = createClient()
    supabase
      .from('turmas')
      .select('id, nome, categoria')
      .eq('professor_id', user.id)
      .order('nome')
      .then(({ data }) => setTurmas(data ?? []))
  }, [user, authLoading, router, fetchAlunos])

  async function atualizarTurma(alunoId: string, turmaId: string) {
    const supabase = createClient()
    await supabase
      .from('alunos')
      .update({ turma_id: turmaId || null })
      .eq('id', alunoId)
    setAlunos((prev) =>
      prev.map((a) => {
        if (a.id !== alunoId) return a
        const turma = turmas.find((t) => t.id === turmaId)
        return { ...a, turma_id: turmaId || null, turmas: turma ? { nome: turma.nome } : null }
      })
    )
  }

  async function salvarAluno(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSalvando(true)
    setErro(null)

    const supabase = createClient()

    // Gera código sequencial único por professor (001, 002, ...)
    const { count } = await supabase
      .from('alunos')
      .select('*', { count: 'exact', head: true })
      .eq('professor_id', user.id)

    const codigo = String((count ?? 0) + 1).padStart(3, '0')

    const { error } = await supabase.from('alunos').insert({
      nome: form.nome.trim(),
      posicao: form.posicao.trim() || null,
      turma_id: form.turma_id || null,
      responsavel: form.responsavel.trim() || null,
      telefone: form.telefone.trim() || null,
      data_nascimento: form.data_nascimento || null,
      professor_id: user.id,
      ativo: true,
      codigo,
    })

    if (error) {
      console.error('Supabase insert error:', error)
      setErro(`Erro ao salvar: ${error.message}`)
      setSalvando(false)
      return
    }

    setForm(formVazio)
    setModalAberto(false)
    setSalvando(false)
    fetchAlunos()
  }

  function fecharModal() {
    setModalAberto(false)
    setErro(null)
    setForm(formVazio)
  }

  const alunosFiltrados = alunos.filter((a) =>
    a.nome.toLowerCase().includes(busca.toLowerCase())
  )

  if (authLoading || carregando) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Carregando...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Atletas</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {alunos.length} atleta{alunos.length !== 1 ? 's' : ''} cadastrado{alunos.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => setModalAberto(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Novo
          </button>
        </div>

        {/* Busca */}
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome..."
          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        {/* Lista */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {alunosFiltrados.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-400 text-sm">
                {busca ? 'Nenhum atleta encontrado.' : 'Nenhum atleta cadastrado ainda.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {alunosFiltrados.map((aluno) => (
                <li
                  key={aluno.id}
                  className="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  {/* Clicável: navega ao perfil */}
                  <button
                    onClick={() => router.push(`/alunos/${aluno.id}`)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        aluno.ativo ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{aluno.nome}</p>
                      {aluno.posicao && (
                        <p className="text-xs text-gray-400 mt-0.5">{aluno.posicao}</p>
                      )}
                    </div>
                  </button>

                  {/* Select de equipe inline */}
                  <select
                    value={aluno.turma_id ?? ''}
                    onChange={(e) => atualizarTurma(aluno.id, e.target.value)}
                    className={`flex-shrink-0 text-xs rounded-lg px-2.5 py-1.5 border focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                      aluno.turma_id
                        ? 'bg-green-50 border-green-200 text-green-700 font-medium'
                        : 'bg-gray-50 border-gray-200 text-gray-400'
                    }`}
                    title="Vincular à equipe"
                  >
                    <option value="">Sem equipe</option>
                    {turmas.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome}
                      </option>
                    ))}
                  </select>

                  {/* Chevron */}
                  <button
                    onClick={() => router.push(`/alunos/${aluno.id}`)}
                    className="flex-shrink-0 text-gray-300 hover:text-gray-500"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Modal novo atleta */}
      {modalAberto && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) fecharModal() }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Novo atleta</h2>
              <button
                onClick={fecharModal}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={salvarAluno} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Nome do atleta"
                />
              </div>

              {/* Data de nascimento */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Data de nascimento
                </label>
                <input
                  type="date"
                  value={form.data_nascimento}
                  onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  max={new Date().toISOString().split('T')[0]}
                />
                {idadeCalculada !== null && categoriaSugerida && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {idadeCalculada} ano{idadeCalculada !== 1 ? 's' : ''}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                      ⚽ {categoriaSugerida}
                    </span>
                  </div>
                )}
              </div>

              {/* Posição */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Posição</label>
                <input
                  type="text"
                  value={form.posicao}
                  onChange={(e) => setForm({ ...form, posicao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: Atacante, Goleiro, Zagueiro..."
                />
              </div>

              {/* Equipe */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Equipe
                  {categoriaSugerida && turmas.some(t => t.categoria === categoriaSugerida) && (
                    <span className="ml-1.5 text-green-600 font-normal">
                      (sugerido: {categoriaSugerida})
                    </span>
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
                      <option key={t.id} value={t.id}>
                        {t.nome}{t.categoria ? ` (${t.categoria})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-gray-400 py-2">
                    Nenhuma equipe cadastrada. Crie equipes primeiro.
                  </p>
                )}
              </div>

              {/* Responsável */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Responsável</label>
                <input
                  type="text"
                  value={form.responsavel}
                  onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Nome do responsável"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Telefone</label>
                <input
                  type="tel"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="(11) 99999-9999"
                />
              </div>

              {erro && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
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
