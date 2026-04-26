'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Aba = 'dados' | 'frequencia' | 'desempenho' | 'financeiro' | 'observacoes'

interface Aluno {
  id: string
  nome: string
  posicao: string | null
  responsavel: string | null
  telefone: string | null
  ativo: boolean
  token_acesso: string | null
  codigo: string | null
  turma_id: string | null
  mensalidade: number | null
  status_pagamento: string | null
  turmas: { nome: string } | null
}

interface Avaliacao {
  nota: number
  categoria: string | null
  data: string | null
}

interface Presenca {
  presente: boolean
  data: string | null
}

interface Pagamento {
  id: string
  valor: number
  status: string
  created_at: string
  link_pix: string | null
}

interface Observacao {
  id: string
  texto: string
  created_at: string
}

interface Props {
  aluno: Aluno
  avaliacoes: Avaliacao[]
  presencas: Presenca[]
  pagamentos: Pagamento[]
  observacoes: Observacao[]
  turmasList: { id: string; nome: string }[]
  scoutScore: number | null
  frequencia: number | null
  frequenciaMes: number | null
  presentes: number
  totalPresencas: number
  linkPublico: string | null
  professorId: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(nome: string) {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0] ?? '')
    .join('')
    .toUpperCase()
}

function avatarBg(nome: string) {
  const colors = [
    'bg-green-500',
    'bg-blue-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-amber-500',
  ]
  let h = 0
  for (const c of nome) h = (h * 31 + c.charCodeAt(0)) % colors.length
  return colors[h]
}

function scoreColor(v: number | null) {
  if (v === null) return 'text-gray-300'
  if (v >= 75) return 'text-green-600'
  if (v >= 50) return 'text-yellow-500'
  return 'text-red-500'
}

function barColor(v: number) {
  if (v >= 75) return 'bg-green-500'
  if (v >= 50) return 'bg-yellow-400'
  return 'bg-red-400'
}

function strokeColor(v: number | null) {
  if (v === null) return '#e5e7eb'
  if (v >= 75) return '#16a34a'
  if (v >= 50) return '#eab308'
  return '#ef4444'
}

const inputCls =
  'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent'

// ── Sub-components ───────────────────────────────────────────────────────────

function CircularProgress({
  value,
  label,
}: {
  value: number | null
  label: string
}) {
  const r = 40
  const circ = 2 * Math.PI * r
  const offset = value !== null ? circ - (value / 100) * circ : circ
  const stroke = strokeColor(value)
  const textFill = value === null ? '#9ca3af' : stroke

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="110" height="110" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f3f4f6" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="18"
          fontWeight="bold"
          fill={textFill}
        >
          {value !== null ? `${value}%` : '—'}
        </text>
      </svg>
      <p className="text-xs text-gray-400 font-medium text-center">{label}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string | null }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    em_dia: { label: 'Em dia', cls: 'bg-green-100 text-green-700' },
    pendente: { label: 'Pendente', cls: 'bg-yellow-100 text-yellow-700' },
    inadimplente: { label: 'Inadimplente', cls: 'bg-red-100 text-red-700' },
    pausado: { label: 'Pausado', cls: 'bg-gray-100 text-gray-500' },
    pago: { label: 'Pago', cls: 'bg-green-100 text-green-700' },
    vencido: { label: 'Vencido', cls: 'bg-red-100 text-red-700' },
    aguardando: { label: 'Aguardando', cls: 'bg-yellow-100 text-yellow-700' },
  }
  const info = status && cfg[status]
    ? cfg[status]
    : { label: status ?? 'Não definido', cls: 'bg-gray-100 text-gray-400' }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${info.cls}`}
    >
      {info.label}
    </span>
  )
}

function InfoRow({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-sm text-gray-800 mt-0.5">{value}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 block mb-1">
        {label}
      </label>
      {children}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PerfilAtleta({
  aluno,
  avaliacoes,
  presencas,
  pagamentos,
  observacoes: initialObservacoes,
  turmasList,
  scoutScore,
  frequencia,
  frequenciaMes,
  presentes,
  totalPresencas,
  linkPublico,
  professorId,
}: Props) {
  const [aba, setAba] = useState<Aba>('dados')
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({
    nome: aluno.nome,
    posicao: aluno.posicao ?? '',
    responsavel: aluno.responsavel ?? '',
    telefone: aluno.telefone ?? '',
    turma_id: aluno.turma_id ?? '',
    ativo: aluno.ativo,
  })

  const [novaObs, setNovaObs] = useState('')
  const [envObs, setEnvObs] = useState(false)
  const [observacoes, setObservacoes] = useState(initialObservacoes)

  const router = useRouter()

  async function salvarEdicao() {
    setSalvando(true)
    const supabase = createClient()
    await supabase
      .from('alunos')
      .update({
        nome: form.nome,
        posicao: form.posicao || null,
        responsavel: form.responsavel || null,
        telefone: form.telefone || null,
        turma_id: form.turma_id || null,
        ativo: form.ativo,
      })
      .eq('id', aluno.id)
    setSalvando(false)
    setEditando(false)
    router.refresh()
  }

  async function adicionarObservacao() {
    if (!novaObs.trim()) return
    setEnvObs(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('observacoes')
      .insert({
        aluno_id: aluno.id,
        professor_id: professorId,
        texto: novaObs.trim(),
      })
      .select('id, texto, created_at')
      .single()
    if (data) {
      setObservacoes([data, ...observacoes])
      setNovaObs('')
    }
    setEnvObs(false)
  }

  // Group avaliacoes by categoria
  const porCategoria = avaliacoes.reduce<
    Record<string, { nota: number; data: string | null }[]>
  >((acc, av) => {
    const cat = av.categoria ?? 'Geral'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push({ nota: av.nota, data: av.data })
    return acc
  }, {})

  const abas: { key: Aba; label: string }[] = [
    { key: 'dados', label: 'Dados' },
    { key: 'frequencia', label: 'Frequência' },
    { key: 'desempenho', label: 'Desempenho' },
    { key: 'financeiro', label: 'Financeiro' },
    { key: 'observacoes', label: 'Observações' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">

        {/* Back */}
        <Link
          href="/alunos"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Atletas
        </Link>

        {/* ── Header card ── */}
        <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0 ${avatarBg(aluno.nome)}`}
            >
              {getInitials(aluno.nome)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  {aluno.nome}
                </h1>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    aluno.ativo
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      aluno.ativo ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                  {aluno.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              {(aluno.posicao || aluno.turmas?.nome) && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {[aluno.posicao, aluno.turmas?.nome].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
            <button
              onClick={() => setEditando(true)}
              className="flex-shrink-0 text-xs font-medium text-gray-400 hover:text-gray-700 border border-gray-200 hover:border-gray-300 rounded-lg px-3 py-1.5 transition-colors"
            >
              Editar
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-hide">
            {abas.map((a) => (
              <button
                key={a.key}
                onClick={() => setAba(a.key)}
                className={`flex-shrink-0 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${
                  aba === a.key
                    ? 'border-green-600 text-green-700 bg-green-50/40'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-6">

            {/* ────────── DADOS ────────── */}
            {aba === 'dados' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  <InfoRow label="Posição" value={aluno.posicao} />
                  <InfoRow label="Equipe" value={aluno.turmas?.nome} />
                  <InfoRow label="Responsável" value={aluno.responsavel} />
                  <InfoRow label="Telefone" value={aluno.telefone} />
                </div>

                {!aluno.posicao && !aluno.turmas?.nome && !aluno.responsavel && !aluno.telefone && (
                  <p className="text-sm text-gray-400">Nenhuma informação cadastrada.</p>
                )}

                {aluno.codigo && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Código de acesso dos pais
                    </p>
                    <p className="text-4xl font-bold tracking-[0.3em] font-mono text-green-700">
                      {aluno.codigo}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Passe este código ao responsável em{' '}
                      <span className="font-medium text-gray-600">
                        scoutbase-eta.vercel.app/pais/entrar
                      </span>
                    </p>
                  </div>
                )}

                {linkPublico && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-400 mb-1">
                      Link público (alternativa sem código)
                    </p>
                    <p className="text-xs text-gray-500 break-all font-mono">{linkPublico}</p>
                  </div>
                )}

                <div>
                  <Link
                    href={`/avaliacoes/${aluno.id}`}
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                  >
                    + Nova avaliação
                  </Link>
                </div>
              </div>
            )}

            {/* ────────── FREQUÊNCIA ────────── */}
            {aba === 'frequencia' && (
              <div className="space-y-6">
                <div className="flex items-start justify-around py-2">
                  <CircularProgress
                    value={frequencia}
                    label={`Geral · ${presentes}/${totalPresencas} aulas`}
                  />
                  <CircularProgress value={frequenciaMes} label="Mês atual" />
                </div>

                {presencas.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                      Histórico de presenças
                    </p>
                    <ul className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                      {presencas.slice(0, 50).map((p, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between py-2.5"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                p.presente ? 'bg-green-500' : 'bg-red-400'
                              }`}
                            />
                            <span className="text-sm text-gray-700">
                              {p.data
                                ? new Date(p.data + 'T12:00:00').toLocaleDateString(
                                    'pt-BR',
                                    {
                                      weekday: 'short',
                                      day: '2-digit',
                                      month: 'short',
                                    }
                                  )
                                : 'Data desconhecida'}
                            </span>
                          </div>
                          <span
                            className={`text-xs font-semibold ${
                              p.presente ? 'text-green-600' : 'text-red-500'
                            }`}
                          >
                            {p.presente ? 'Presente' : 'Faltou'}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {presencas.length > 50 && (
                      <p className="text-xs text-gray-400 text-center mt-3">
                        +{presencas.length - 50} registros mais antigos
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-6">
                    Nenhuma presença registrada ainda.
                  </p>
                )}
              </div>
            )}

            {/* ────────── DESEMPENHO ────────── */}
            {aba === 'desempenho' && (
              <div className="space-y-6">
                {/* Scout Score */}
                <div className="flex items-center gap-5 bg-gray-50 rounded-xl p-5">
                  <div className="text-center flex-shrink-0">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
                      Scout Score
                    </p>
                    <p
                      className={`text-6xl font-bold leading-none ${scoreColor(scoutScore)}`}
                    >
                      {scoutScore ?? '—'}
                    </p>
                    {scoutScore !== null && (
                      <p className="text-xs text-gray-400 mt-1">de 100</p>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {scoutScore !== null ? (
                      <>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div
                            className={`h-2 rounded-full transition-all ${barColor(scoutScore)}`}
                            style={{ width: `${scoutScore}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          {scoutScore >= 75
                            ? '🟢 Excelente desempenho'
                            : scoutScore >= 50
                            ? '🟡 Desempenho mediano'
                            : '🔴 Necessita atenção'}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Baseado em {avaliacoes.length} avaliação
                          {avaliacoes.length !== 1 ? 'ões' : ''}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-400">
                        Nenhuma avaliação registrada ainda.
                      </p>
                    )}
                  </div>
                </div>

                {/* Por categoria */}
                {Object.keys(porCategoria).length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Por categoria
                    </p>
                    {Object.entries(porCategoria).map(([cat, items]) => {
                      const media = Math.round(
                        items.reduce((a, b) => a + b.nota, 0) / items.length
                      )
                      return (
                        <div key={cat} className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-700">{cat}</p>
                            <span
                              className={`text-sm font-bold ${scoreColor(media)}`}
                            >
                              {media}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${barColor(media)}`}
                              style={{ width: `${media}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-1.5">
                            {items.length} avaliação
                            {items.length !== 1 ? 'ões' : ''}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Histórico */}
                {avaliacoes.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                      Histórico
                    </p>
                    <ul className="divide-y divide-gray-50">
                      {avaliacoes.slice(0, 10).map((av, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between py-3"
                        >
                          <div>
                            {av.categoria && (
                              <p className="text-sm text-gray-800">{av.categoria}</p>
                            )}
                            {av.data && (
                              <p className="text-xs text-gray-400">
                                {new Date(av.data).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                          <span
                            className={`text-sm font-bold ${scoreColor(av.nota)}`}
                          >
                            {av.nota}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <Link
                    href={`/avaliacoes/${aluno.id}`}
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                  >
                    + Nova avaliação
                  </Link>
                </div>
              </div>
            )}

            {/* ────────── FINANCEIRO ────────── */}
            {aba === 'financeiro' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-1.5">
                      Status de pagamento
                    </p>
                    <StatusBadge status={aluno.status_pagamento} />
                  </div>
                  {aluno.mensalidade !== null && aluno.mensalidade !== undefined && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Mensalidade</p>
                      <p className="text-lg font-bold text-gray-900 mt-0.5">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(aluno.mensalidade)}
                      </p>
                    </div>
                  )}
                </div>

                {pagamentos.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                      Histórico de cobranças
                    </p>
                    <ul className="divide-y divide-gray-50">
                      {pagamentos.map((pag) => (
                        <li
                          key={pag.id}
                          className="flex items-center justify-between py-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(pag.valor)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(pag.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <StatusBadge status={pag.status} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-6">
                    Nenhum pagamento registrado.
                  </p>
                )}

                <div>
                  <Link
                    href="/financeiro"
                    className="inline-flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
                  >
                    Ver painel financeiro →
                  </Link>
                </div>
              </div>
            )}

            {/* ────────── OBSERVAÇÕES ────────── */}
            {aba === 'observacoes' && (
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Nova observação
                  </p>
                  <textarea
                    value={novaObs}
                    onChange={(e) => setNovaObs(e.target.value)}
                    placeholder="Anote aqui desempenho, comportamento, lesão, evolução..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  />
                  <button
                    onClick={adicionarObservacao}
                    disabled={envObs || !novaObs.trim()}
                    className="mt-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                  >
                    {envObs ? 'Salvando...' : 'Salvar observação'}
                  </button>
                </div>

                {observacoes.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                      Histórico
                    </p>
                    <ul className="space-y-3">
                      {observacoes.map((obs) => (
                        <li key={obs.id} className="bg-gray-50 rounded-xl p-4">
                          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                            {obs.texto}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(obs.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-6">
                    Nenhuma observação registrada.
                  </p>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Edit Modal ── */}
      {editando && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[20px] shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Editar atleta</h2>
              <button
                onClick={() => setEditando(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-7 h-7 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <Field label="Nome">
                <input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Posição">
                <input
                  value={form.posicao}
                  onChange={(e) =>
                    setForm({ ...form, posicao: e.target.value })
                  }
                  className={inputCls}
                  placeholder="ex: Atacante"
                />
              </Field>
              <Field label="Responsável">
                <input
                  value={form.responsavel}
                  onChange={(e) =>
                    setForm({ ...form, responsavel: e.target.value })
                  }
                  className={inputCls}
                />
              </Field>
              <Field label="Telefone">
                <input
                  value={form.telefone}
                  onChange={(e) =>
                    setForm({ ...form, telefone: e.target.value })
                  }
                  className={inputCls}
                />
              </Field>
              <Field label="Equipe">
                <select
                  value={form.turma_id}
                  onChange={(e) =>
                    setForm({ ...form, turma_id: e.target.value })
                  }
                  className={inputCls}
                >
                  <option value="">Sem equipe</option>
                  {turmasList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, ativo: !f.ativo }))
                  }
                  className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                    form.ativo ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      form.ativo ? 'translate-x-4' : ''
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-700">
                  {form.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditando(false)}
                className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvarEdicao}
                disabled={salvando}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
