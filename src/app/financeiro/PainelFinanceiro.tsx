'use client'

import { useState, useMemo } from 'react'
import EmptyState from '@/components/EmptyState'

// ── Types ─────────────────────────────────────────────────────────────────────

type Aluno = {
  id: string
  nome: string
  scout_id: string | null
  telefone: string | null
  responsavel: string | null
  status_pagamento: string | null
  mensalidade: number | null
  turma_id: string | null
  turmas: { id: string; nome: string } | null
}

type Pagamento = {
  id: string
  aluno_id: string
  valor: number
  status: string
  data_pagamento: string | null
  forma_pagamento: string | null
  mes_ano: string | null
  competencia: string | null
  vencimento: string | null
  asaas_link: string | null
}

type Props = {
  alunos: Aluno[]
  pagamentos: Pagamento[]
  turmas: { id: string; nome: string }[]
  opcaoRecebimento: 'app' | 'fora'
  mensalidadePadrao: number
  walletId: string | null
  professorId: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mesAtual() {
  return new Date().toISOString().slice(0, 7)
}

function gerarMeses(n = 6) {
  const meses: { value: string; label: string }[] = []
  const d = new Date()
  for (let i = 0; i < n; i++) {
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    meses.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) })
    d.setMonth(d.getMonth() - 1)
  }
  return meses
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatData(d: string | null) {
  if (!d) return '—'
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
}

const STATUS_MAP: Record<string, { label: string; icon: string; chip: string }> = {
  em_dia:  { label: 'Pago',       icon: '✅', chip: 'bg-green-100 text-green-700' },
  atraso:  { label: 'Em atraso',  icon: '❌', chip: 'bg-red-100  text-red-700'   },
  pendente:{ label: 'Pendente',   icon: '⚠️', chip: 'bg-amber-100 text-amber-700' },
  pausado: { label: 'Pausado',    icon: '—',  chip: 'bg-gray-100 text-gray-500'  },
}

function statusInfo(s: string | null) {
  return STATUS_MAP[s ?? 'em_dia'] ?? STATUS_MAP.em_dia
}

const FORMA_LABELS: Record<string, string> = {
  pix: 'Pix', dinheiro: 'Dinheiro', cartao: 'Cartão',
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PainelFinanceiro({
  alunos: alunosIniciais,
  pagamentos: pagamentosIniciais,
  turmas,
  opcaoRecebimento,
  mensalidadePadrao,
  professorId,
}: Props) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [alunos, setAlunos] = useState(alunosIniciais)
  const [pagamentos, setPagamentos] = useState(pagamentosIniciais)

  const MESES = useMemo(() => gerarMeses(), [])
  const [filtroMes, setFiltroMes] = useState(mesAtual())
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'em_dia' | 'pendente' | 'atraso'>('todos')
  const [filtroTurma, setFiltroTurma] = useState('todas')

  // Modal registrar pagamento
  const [modalAluno, setModalAluno] = useState<Aluno | null>(null)
  const [modalValor, setModalValor] = useState('')
  const [modalData, setModalData] = useState(() => new Date().toISOString().split('T')[0])
  const [modalForma, setModalForma] = useState<'pix' | 'dinheiro' | 'cartao'>('pix')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // ── Métricas ───────────────────────────────────────────────────────────────

  const metrics = useMemo(() => {
    const ativos = alunos

    const recebidoMes = pagamentos
      .filter((p) => p.status === 'pago' && p.mes_ano === filtroMes)
      .reduce((s, p) => s + p.valor, 0)

    const emAtrasoValor = ativos
      .filter((a) => a.status_pagamento === 'atraso')
      .reduce((s, a) => s + (a.mensalidade ?? mensalidadePadrao), 0)

    const previsaoMensal = ativos
      .reduce((s, a) => s + (a.mensalidade ?? mensalidadePadrao), 0)

    const totalAtivos = ativos.length
    const qtdAtraso = ativos.filter((a) => a.status_pagamento === 'atraso').length
    const taxaInadimplencia = totalAtivos > 0 ? Math.round((qtdAtraso / totalAtivos) * 100) : 0

    return { recebidoMes, emAtrasoValor, previsaoMensal, taxaInadimplencia }
  }, [alunos, pagamentos, filtroMes, mensalidadePadrao])

  // ── Filtros ────────────────────────────────────────────────────────────────

  const alunosFiltrados = useMemo(() => {
    return alunos.filter((a) => {
      if (filtroStatus !== 'todos' && a.status_pagamento !== filtroStatus) return false
      if (filtroTurma !== 'todas' && a.turma_id !== filtroTurma) return false
      return true
    })
  }, [alunos, filtroStatus, filtroTurma])

  // ── Último pagamento por atleta ────────────────────────────────────────────

  const ultimoPagamento = useMemo(() => {
    const map: Record<string, Pagamento> = {}
    for (const p of pagamentos) {
      if (p.status === 'pago') {
        if (!map[p.aluno_id] || (p.data_pagamento ?? '') > (map[p.aluno_id].data_pagamento ?? '')) {
          map[p.aluno_id] = p
        }
      }
    }
    return map
  }, [pagamentos])

  // ── Abrir modal ────────────────────────────────────────────────────────────

  function abrirModal(aluno: Aluno) {
    setModalAluno(aluno)
    setModalValor(String(aluno.mensalidade ?? mensalidadePadrao ?? ''))
    setModalData(new Date().toISOString().split('T')[0])
    setModalForma('pix')
    setErro(null)
  }

  // ── Registrar pagamento ────────────────────────────────────────────────────

  async function registrarPagamento() {
    if (!modalAluno) return
    const valor = parseFloat(modalValor.replace(',', '.'))
    if (!valor || valor <= 0) { setErro('Informe um valor válido.'); return }
    if (!modalData) { setErro('Informe a data.'); return }

    setSalvando(true)
    setErro(null)

    const res = await fetch('/api/financeiro/registrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alunoId: modalAluno.id,
        valor,
        dataPagamento: modalData,
        formaPagamento: modalForma,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setErro(data.error ?? 'Erro ao registrar pagamento.')
      setSalvando(false)
      return
    }

    // Atualiza estado local
    setPagamentos((prev) => [data.pagamento, ...prev])
    setAlunos((prev) =>
      prev.map((a) => a.id === modalAluno.id ? { ...a, status_pagamento: 'em_dia' } : a)
    )
    setModalAluno(null)
    setSalvando(false)
  }

  // ── WhatsApp ───────────────────────────────────────────────────────────────

  function whatsappUrl(aluno: Aluno) {
    const tel = aluno.telefone?.replace(/\D/g, '') ?? ''
    const valor = aluno.mensalidade ?? mensalidadePadrao
    const msg = encodeURIComponent(
      `Olá! A mensalidade de ${aluno.nome} no valor de ${formatBRL(valor)} está pendente. Acesse o Meu Craque para mais detalhes.`
    )
    return `https://wa.me/55${tel}?text=${msg}`
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
        <p className="text-sm text-gray-500 mt-1">Controle de mensalidades e pagamentos</p>
      </div>

      {/* ── 4 Cards de métricas ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Recebido no mês"
          value={formatBRL(metrics.recebidoMes)}
          color="text-green-600"
          icon="💰"
        />
        <MetricCard
          label="Em atraso"
          value={formatBRL(metrics.emAtrasoValor)}
          color="text-red-500"
          icon="❌"
        />
        <MetricCard
          label="Previsão mensal"
          value={formatBRL(metrics.previsaoMensal)}
          color="text-blue-600"
          icon="📅"
        />
        <MetricCard
          label="Inadimplência"
          value={`${metrics.taxaInadimplencia}%`}
          color={metrics.taxaInadimplencia > 20 ? 'text-red-500' : metrics.taxaInadimplencia > 0 ? 'text-amber-500' : 'text-green-600'}
          icon="📊"
        />
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-wrap gap-2">
        {/* Mês */}
        <select
          value={filtroMes}
          onChange={(e) => setFiltroMes(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {MESES.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        {/* Status */}
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value as typeof filtroStatus)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="todos">Todos os status</option>
          <option value="em_dia">Pagos</option>
          <option value="pendente">Pendentes</option>
          <option value="atraso">Em atraso</option>
        </select>

        {/* Equipe */}
        {turmas.length > 0 && (
          <select
            value={filtroTurma}
            onChange={(e) => setFiltroTurma(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="todas">Todas as equipes</option>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>
        )}

        {/* Contagem */}
        <div className="ml-auto flex items-center">
          <span className="text-xs text-gray-400">
            {alunosFiltrados.length} atleta{alunosFiltrados.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── Lista de atletas ── */}
      <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden">
        {alunosFiltrados.length === 0 ? (
          alunos.length === 0 ? (
            <EmptyState
              icon="💰"
              title="Nenhum registro financeiro ainda."
              subtitle="Cadastre atletas e defina as mensalidades para começar o controle."
              action={{ label: 'Cadastrar atleta →', href: '/alunos' }}
            />
          ) : (
            <div className="py-16 text-center">
              <p className="text-gray-400 text-sm">Nenhum atleta encontrado com esses filtros.</p>
            </div>
          )
        ) : (
          <ul className="divide-y divide-gray-50">
            {alunosFiltrados.map((aluno) => {
              const st = statusInfo(aluno.status_pagamento)
              const valor = aluno.mensalidade ?? mensalidadePadrao
              const ult = ultimoPagamento[aluno.id] ?? null
              const temTelefone = !!aluno.telefone

              return (
                <li key={aluno.id} className="px-5 py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* ── Info ── */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">{aluno.nome}</p>
                        {aluno.scout_id && (
                          <span className="text-xs font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                            {aluno.scout_id}
                          </span>
                        )}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.chip}`}>
                          {st.icon} {st.label}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                        <span>{aluno.turmas?.nome ?? 'Sem turma'}</span>
                        <span className="font-medium text-gray-600">
                          {valor > 0 ? formatBRL(valor) + '/mês' : 'Sem mensalidade'}
                        </span>
                        {ult && (
                          <span>
                            Último pag.: {formatData(ult.data_pagamento)}
                            {ult.forma_pagamento ? ` · ${FORMA_LABELS[ult.forma_pagamento] ?? ult.forma_pagamento}` : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ── Ações ── */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Registrar pagamento */}
                      <button
                        onClick={() => abrirModal(aluno)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#16a34a] text-white hover:bg-green-700 transition-colors"
                      >
                        Registrar pagamento
                      </button>

                      {/* WhatsApp */}
                      {temTelefone ? (
                        <a
                          href={whatsappUrl(aluno)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-green-200 text-green-700 hover:bg-green-50 transition-colors flex items-center gap-1.5"
                        >
                          <WhatsAppIcon />
                          Cobrar
                        </a>
                      ) : (
                        <button
                          disabled
                          title="Sem telefone cadastrado"
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-300 cursor-not-allowed flex items-center gap-1.5"
                        >
                          <WhatsAppIcon />
                          Cobrar
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* ── Histórico de pagamentos registrados ── */}
      {(() => {
        const pagsMes = pagamentos.filter((p) => p.mes_ano === filtroMes && p.status === 'pago')
        if (pagsMes.length === 0) return null
        return (
          <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="text-sm font-semibold text-gray-900">
                Pagamentos registrados em {MESES.find((m) => m.value === filtroMes)?.label ?? filtroMes}
              </h2>
            </div>
            <ul className="divide-y divide-gray-50">
              {pagsMes.map((p) => {
                const a = alunos.find((al) => al.id === p.aluno_id)
                return (
                  <li key={p.id} className="px-5 py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{a?.nome ?? '—'}</p>
                      <p className="text-xs text-gray-400">
                        {formatData(p.data_pagamento)}
                        {p.forma_pagamento ? ` · ${FORMA_LABELS[p.forma_pagamento] ?? p.forma_pagamento}` : ''}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-green-600">{formatBRL(p.valor)}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })()}

      {/* ── Modal registrar pagamento ── */}
      {modalAluno && (
        <>
          <style>{`
            @keyframes modal-in {
              from { opacity: 0; transform: scale(0.93) translateY(10px); }
              to   { opacity: 1; transform: scale(1) translateY(0); }
            }
            .modal-card { animation: modal-in 0.22s cubic-bezier(0.16,1,0.3,1) both; }
          `}</style>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setModalAluno(null) }}
          >
            <div className="modal-card relative w-full max-w-sm bg-white rounded-[20px] shadow-2xl overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-[#16a34a] to-green-400" />

              <div className="px-6 pt-6 pb-7">
                <h2 className="text-lg font-bold text-gray-900 mb-0.5">Registrar pagamento</h2>
                <p className="text-sm text-gray-400 mb-5">{modalAluno.nome}</p>

                <div className="space-y-4">
                  {/* Valor */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Valor (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={modalValor}
                      onChange={(e) => setModalValor(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="0,00"
                    />
                  </div>

                  {/* Data */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Data do pagamento</label>
                    <input
                      type="date"
                      value={modalData}
                      onChange={(e) => setModalData(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* Forma */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Forma de pagamento</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['pix', 'dinheiro', 'cartao'] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setModalForma(f)}
                          className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                            modalForma === f
                              ? 'bg-green-600 text-white border-green-600'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                          }`}
                        >
                          {FORMA_LABELS[f]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {erro && (
                    <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</p>
                  )}

                  <button
                    onClick={registrarPagamento}
                    disabled={salvando}
                    className="w-full py-3 rounded-xl bg-[#16a34a] hover:bg-green-700 disabled:opacity-50 text-white text-sm font-bold transition-colors mt-1"
                  >
                    {salvando ? 'Salvando…' : 'Confirmar pagamento'}
                  </button>
                </div>
              </div>

              <button
                onClick={() => setModalAluno(null)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                aria-label="Fechar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({ label, value, color, icon }: {
  label: string; value: string; color: string; icon: string
}) {
  return (
    <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm px-5 py-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <p className="text-xs text-gray-400 leading-tight">{label}</p>
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}