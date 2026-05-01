'use client'

import { useState, useMemo } from 'react'

type AdminUser = {
  id: string
  email: string
  nome: string
  tipo: string
  aluno_scout_id: string | null
  aluno_nome: string | null
  created_at: string
  last_sign_in_at: string | null
}

type Atleta = {
  id: string
  nome: string
  posicao: string | null
  scout_id: string | null
  ativo: boolean
  professor_id: string | null
  created_at: string
}

type Stats = {
  totalUsuarios: number
  totalAtletas: number
  totalAvaliacoes: number
  totalPresencas: number
  professores: number
  responsaveis: number
}

interface Props {
  users: AdminUser[]
  atletas: Atleta[]
  stats: Stats
}

type Aba = 'stats' | 'usuarios' | 'atletas'

export default function AdminClient({ users: initialUsers, atletas: initialAtletas, stats }: Props) {
  const [aba, setAba] = useState<Aba>('stats')
  const [busca, setBusca] = useState('')
  const [users, setUsers] = useState(initialUsers)
  const [atletas, setAtletas] = useState(initialAtletas)
  const [modalUsuario, setModalUsuario] = useState<AdminUser | null>(null)
  const [modalAtleta, setModalAtleta] = useState<Atleta | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  // Edit user form
  const [editNome, setEditNome] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [novaSenha, setNovaSenha] = useState('')

  function abrirUsuario(u: AdminUser) {
    setModalUsuario(u)
    setEditNome(u.nome)
    setEditEmail(u.email)
    setNovaSenha('')
    setMsg(null)
  }

  const usuariosFiltrados = useMemo(() => {
    const q = busca.toLowerCase()
    if (!q) return users
    return users.filter((u) =>
      u.email.toLowerCase().includes(q) ||
      u.nome.toLowerCase().includes(q) ||
      (u.aluno_scout_id ?? '').toLowerCase().includes(q) ||
      (u.aluno_nome ?? '').toLowerCase().includes(q)
    )
  }, [users, busca])

  const atletasFiltrados = useMemo(() => {
    const q = busca.toLowerCase()
    if (!q) return atletas
    return atletas.filter((a) =>
      a.nome.toLowerCase().includes(q) ||
      (a.scout_id ?? '').toLowerCase().includes(q) ||
      (a.posicao ?? '').toLowerCase().includes(q)
    )
  }, [atletas, busca])

  async function salvarUsuario() {
    if (!modalUsuario) return
    setLoading(true)
    setMsg(null)
    const res = await fetch('/api/admin/update-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: modalUsuario.id, nome: editNome, email: editEmail }),
    })
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === modalUsuario.id ? { ...u, nome: editNome, email: editEmail } : u))
      setMsg({ tipo: 'ok', texto: 'Usuário atualizado.' })
    } else {
      setMsg({ tipo: 'erro', texto: 'Erro ao atualizar.' })
    }
    setLoading(false)
  }

  async function resetarSenha() {
    if (!modalUsuario || !novaSenha.trim()) return
    setLoading(true)
    setMsg(null)
    const res = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: modalUsuario.id, novaSenha }),
    })
    if (res.ok) {
      setMsg({ tipo: 'ok', texto: 'Senha alterada com sucesso.' })
      setNovaSenha('')
    } else {
      setMsg({ tipo: 'erro', texto: 'Erro ao alterar senha.' })
    }
    setLoading(false)
  }

  async function deletarUsuario() {
    if (!modalUsuario) return
    if (!confirm(`Deletar permanentemente o usuário ${modalUsuario.email}? Esta ação não pode ser desfeita.`)) return
    setLoading(true)
    const res = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: modalUsuario.id }),
    })
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== modalUsuario.id))
      setModalUsuario(null)
    } else {
      setMsg({ tipo: 'erro', texto: 'Erro ao deletar usuário.' })
    }
    setLoading(false)
  }

  async function deletarAtleta() {
    if (!modalAtleta) return
    if (!confirm(`Deletar permanentemente o atleta ${modalAtleta.nome}? Esta ação não pode ser desfeita.`)) return
    setLoading(true)
    const res = await fetch('/api/admin/delete-athlete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ atletaId: modalAtleta.id }),
    })
    if (res.ok) {
      setAtletas((prev) => prev.filter((a) => a.id !== modalAtleta.id))
      setModalAtleta(null)
    } else {
      alert('Erro ao deletar atleta.')
    }
    setLoading(false)
  }

  const abas: { id: Aba; label: string }[] = [
    { id: 'stats', label: 'Visão Geral' },
    { id: 'usuarios', label: `Usuários (${users.length})` },
    { id: 'atletas', label: `Atletas (${atletas.length})` },
  ]

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-red-500 bg-red-50 px-2 py-0.5 rounded">ADMIN</span>
            <span className="text-xs text-gray-400">Acesso restrito</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-sm text-gray-500 mt-0.5">ScoutBase — visão completa do sistema</p>
        </div>

        {/* Abas */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-6">
          {abas.map((a) => (
            <button
              key={a.id}
              onClick={() => { setAba(a.id); setBusca('') }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                aba === a.id ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        {/* ── STATS ── */}
        {aba === 'stats' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Usuários totais', value: stats.totalUsuarios, cor: 'text-gray-900' },
                { label: 'Treinadores', value: stats.professores, cor: 'text-blue-600' },
                { label: 'Responsáveis', value: stats.responsaveis, cor: 'text-purple-600' },
                { label: 'Atletas', value: stats.totalAtletas, cor: 'text-green-600' },
                { label: 'Avaliações', value: stats.totalAvaliacoes, cor: 'text-amber-600' },
                { label: 'Registros de presença', value: stats.totalPresencas, cor: 'text-gray-600' },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
                  <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                  <p className={`text-3xl font-bold ${s.cor}`}>{s.value.toLocaleString('pt-BR')}</p>
                </div>
              ))}
            </div>

            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Últimos usuários cadastrados</h2>
              <ul className="divide-y divide-gray-50">
                {[...users].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8).map((u) => (
                  <li key={u.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{u.nome || u.email}</p>
                      <p className="text-xs text-gray-400">{u.email} · {u.tipo === 'pai' ? 'Responsável' : 'Treinador'}</p>
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── USUÁRIOS ── */}
        {aba === 'usuarios' && (
          <div className="space-y-4">
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, email ou SID..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <ul className="divide-y divide-gray-50">
                {usuariosFiltrados.length === 0 && (
                  <li className="px-5 py-8 text-center text-gray-400 text-sm">Nenhum resultado.</li>
                )}
                {usuariosFiltrados.map((u) => (
                  <li
                    key={u.id}
                    onClick={() => abrirUsuario(u)}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {u.nome || '(sem nome)'}{' '}
                        <span className={`text-xs font-normal ${u.tipo === 'pai' ? 'text-purple-500' : 'text-blue-500'}`}>
                          {u.tipo === 'pai' ? 'Responsável' : 'Treinador'}
                        </span>
                      </p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      {u.aluno_scout_id && (
                        <p className="text-xs font-mono text-green-600">{u.aluno_scout_id}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString('pt-BR')}</p>
                      <p className="text-xs text-gray-300">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString('pt-BR') : '—'}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── ATLETAS ── */}
        {aba === 'atletas' && (
          <div className="space-y-4">
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, SID ou posição..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <ul className="divide-y divide-gray-50">
                {atletasFiltrados.length === 0 && (
                  <li className="px-5 py-8 text-center text-gray-400 text-sm">Nenhum resultado.</li>
                )}
                {atletasFiltrados.map((a) => (
                  <li
                    key={a.id}
                    onClick={() => setModalAtleta(a)}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {a.nome}{' '}
                        <span className={`text-xs font-normal ${a.ativo ? 'text-green-500' : 'text-gray-400'}`}>
                          {a.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </p>
                      <p className="text-xs text-gray-400">{a.posicao ?? '—'}</p>
                      {a.scout_id && <p className="text-xs font-mono text-green-600">{a.scout_id}</p>}
                    </div>
                    <p className="text-xs text-gray-400 shrink-0 ml-4">
                      {new Date(a.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal usuário ── */}
      {modalUsuario && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Detalhes do usuário</h3>
              <button onClick={() => { setModalUsuario(null); setMsg(null) }} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Info readonly */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-xs text-gray-500 font-mono">
                <p><span className="text-gray-400">ID:</span> {modalUsuario.id}</p>
                <p><span className="text-gray-400">Tipo:</span> {modalUsuario.tipo === 'pai' ? 'Responsável' : 'Treinador'}</p>
                <p><span className="text-gray-400">Cadastro:</span> {new Date(modalUsuario.created_at).toLocaleString('pt-BR')}</p>
                <p><span className="text-gray-400">Último login:</span> {modalUsuario.last_sign_in_at ? new Date(modalUsuario.last_sign_in_at).toLocaleString('pt-BR') : '—'}</p>
                {modalUsuario.aluno_scout_id && <p><span className="text-gray-400">SID:</span> {modalUsuario.aluno_scout_id}</p>}
                {modalUsuario.aluno_nome && <p><span className="text-gray-400">Atleta:</span> {modalUsuario.aluno_nome}</p>}
              </div>

              {/* Editar nome */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nome</label>
                <input
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              {/* Editar email */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <button
                onClick={salvarUsuario}
                disabled={loading}
                className="w-full py-2 bg-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {loading ? 'Salvando...' : 'Salvar alterações'}
              </button>

              {/* Reset senha */}
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-xs font-medium text-gray-700 mb-1">Nova senha</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                  <button
                    onClick={resetarSenha}
                    disabled={loading || novaSenha.length < 6}
                    className="px-3 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    Resetar
                  </button>
                </div>
              </div>

              {msg && (
                <p className={`text-sm rounded-lg px-3 py-2 ${msg.tipo === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                  {msg.texto}
                </p>
              )}

              {/* Deletar */}
              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={deletarUsuario}
                  disabled={loading}
                  className="w-full py-2 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 text-sm font-medium rounded-lg transition-colors"
                >
                  Deletar conta permanentemente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal atleta ── */}
      {modalAtleta && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Detalhes do atleta</h3>
              <button onClick={() => setModalAtleta(null)} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-xs text-gray-500 font-mono">
                <p><span className="text-gray-400">ID:</span> {modalAtleta.id}</p>
                <p><span className="text-gray-400">Nome:</span> {modalAtleta.nome}</p>
                <p><span className="text-gray-400">Posição:</span> {modalAtleta.posicao ?? '—'}</p>
                <p><span className="text-gray-400">SID:</span> {modalAtleta.scout_id ?? '—'}</p>
                <p><span className="text-gray-400">Status:</span> {modalAtleta.ativo ? 'Ativo' : 'Inativo'}</p>
                <p><span className="text-gray-400">Cadastro:</span> {new Date(modalAtleta.created_at).toLocaleDateString('pt-BR')}</p>
                <p><span className="text-gray-400">Professor ID:</span> {modalAtleta.professor_id ?? '—'}</p>
              </div>
              <button
                onClick={deletarAtleta}
                disabled={loading}
                className="w-full py-2 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 text-sm font-medium rounded-lg transition-colors"
              >
                {loading ? 'Deletando...' : 'Deletar atleta permanentemente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
