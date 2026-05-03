'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import EmptyState from '@/components/EmptyState'

type Turma = { id: string; nome: string }

type Evento = {
  id: string
  turma_id: string | null
  tipo: string
  data: string
  horario: string | null
  local: string | null
  observacao: string | null
}

const TIPOS = [
  { value: 'treino',      label: 'Treino',       cor: 'bg-green-500' },
  { value: 'jogo',        label: 'Jogo',         cor: 'bg-blue-500' },
  { value: 'avaliacao',   label: 'Avaliação',    cor: 'bg-purple-500' },
  { value: 'reuniao',     label: 'Reunião',      cor: 'bg-amber-500' },
  { value: 'outro',       label: 'Outro',        cor: 'bg-gray-400' },
]

function corParaTipo(tipo: string) {
  return TIPOS.find((t) => t.value === tipo)?.cor ?? 'bg-gray-400'
}
function labelParaTipo(tipo: string) {
  return TIPOS.find((t) => t.value === tipo)?.label ?? tipo
}

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

interface Props {
  turmas: Turma[]
  eventosBanco: Evento[]
  professorId: string
}

export default function AgendaClient({ turmas, eventosBanco, professorId }: Props) {
  const router = useRouter()
  const hoje = new Date()

  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth()) // 0-based
  const [filtroTurma, setFiltroTurma] = useState<string>('todas')
  const [eventos, setEventos] = useState<Evento[]>(eventosBanco)

  // Modal criar
  const [modalAberto, setModalAberto] = useState(false)
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null)

  // Modal detalhe
  const [eventoDetalhe, setEventoDetalhe] = useState<Evento | null>(null)

  // Form novo evento
  const [form, setForm] = useState({
    turma_id: turmas[0]?.id ?? '',
    tipo: 'treino',
    data: '',
    horario: '',
    local: '',
    observacao: '',
  })
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  // ── Calendário ──────────────────────────────
  const primeiroDia = new Date(ano, mes, 1).getDay() // dia da semana do dia 1
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()

  // Células do grid (null = célula vazia antes do dia 1)
  const celulas: (number | null)[] = [
    ...Array(primeiroDia).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ]

  // Eventos filtrados por turma
  const eventosFiltrados = useMemo(() => {
    if (filtroTurma === 'todas') return eventos
    return eventos.filter((e) => e.turma_id === filtroTurma)
  }, [eventos, filtroTurma])

  // Mapa: 'YYYY-MM-DD' → Evento[]
  const eventosPorDia = useMemo(() => {
    const mapa: Record<string, Evento[]> = {}
    for (const ev of eventosFiltrados) {
      if (!mapa[ev.data]) mapa[ev.data] = []
      mapa[ev.data].push(ev)
    }
    return mapa
  }, [eventosFiltrados])

  function dataStr(dia: number) {
    return `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
  }

  function mesAnterior() {
    if (mes === 0) { setMes(11); setAno(ano - 1) }
    else setMes(mes - 1)
  }
  function proximoMes() {
    if (mes === 11) { setMes(0); setAno(ano + 1) }
    else setMes(mes + 1)
  }

  function abrirNovoEvento(dia?: number) {
    const d = dia ? dataStr(dia) : ''
    // Se há um filtro de equipe ativo, pré-seleciona essa equipe no form
    const defaultTurma = filtroTurma !== 'todas' ? filtroTurma : (turmas[0]?.id ?? '')
    setForm({ turma_id: defaultTurma, tipo: 'treino', data: d, horario: '', local: '', observacao: '' })
    setDiaSelecionado(d)
    setModalAberto(true)
  }

  async function salvarEvento(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('eventos').insert({
      professor_id: professorId,
      turma_id: form.turma_id || null,
      tipo: form.tipo,
      data: form.data,
      horario: form.horario || null,
      local: form.local || null,
      observacao: form.observacao || null,
    }).select('id, turma_id, tipo, data, horario, local, observacao').single()

    if (!error && data) {
      setEventos((prev) => [...prev, data as Evento])
    }
    setSalvando(false)
    setModalAberto(false)
  }

  async function excluirEvento(id: string) {
    setExcluindo(true)
    const supabase = createClient()
    await supabase.from('eventos').delete().eq('id', id)
    setEventos((prev) => prev.filter((ev) => ev.id !== id))
    setExcluindo(false)
    setEventoDetalhe(null)
  }

  const isHoje = (dia: number) => {
    return ano === hoje.getFullYear() && mes === hoje.getMonth() && dia === hoje.getDate()
  }

  return (
    <main className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Agenda</h1>
        <p className="text-sm text-gray-500 mt-0.5">Treinos, jogos e eventos da equipe</p>
      </div>

      {/* Filtro de turma */}
      {turmas.length > 1 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setFiltroTurma('todas')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filtroTurma === 'todas'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todas as equipes
          </button>
          {turmas.map((t) => (
            <button
              key={t.id}
              onClick={() => setFiltroTurma(t.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filtroTurma === t.id
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.nome}
            </button>
          ))}
        </div>
      )}

      {/* Hint */}
      <p className="text-xs text-gray-400 italic mb-3">Clique no dia para adicionar seu evento.</p>

      {/* Navegação mês */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <button
            onClick={mesAnterior}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-sm font-semibold text-gray-900">
            {MESES[mes]} {ano}
          </h2>
          <button
            onClick={proximoMes}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Dias da semana */}
        <div className="grid grid-cols-7 border-b border-gray-50">
          {DIAS_SEMANA.map((d) => (
            <div key={d} className="text-center py-2 text-xs font-medium text-gray-400">
              {d}
            </div>
          ))}
        </div>

        {/* Grid de dias */}
        <div className="grid grid-cols-7">
          {celulas.map((dia, idx) => {
            const ds = dia ? dataStr(dia) : null
            const evsDia = ds ? (eventosPorDia[ds] ?? []) : []
            const hoje_ = dia ? isHoje(dia) : false
            return (
              <div
                key={idx}
                onClick={() => dia && abrirNovoEvento(dia)}
                className={`min-h-[72px] border-b border-r border-gray-50 p-1.5 cursor-pointer transition-colors ${
                  dia
                    ? 'hover:bg-gray-50'
                    : 'bg-gray-50/50 cursor-default'
                }`}
              >
                {dia && (
                  <>
                    <span className={`inline-flex items-center justify-center w-6 h-6 text-xs rounded-full mb-1 ${
                      hoje_
                        ? 'bg-green-600 text-white font-bold'
                        : 'text-gray-700'
                    }`}>
                      {dia}
                    </span>
                    <div className="space-y-0.5">
                      {evsDia.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          onClick={(e) => { e.stopPropagation(); setEventoDetalhe(ev) }}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-white text-[10px] font-medium truncate cursor-pointer ${corParaTipo(ev.tipo)}`}
                        >
                          <span className="truncate">{labelParaTipo(ev.tipo)}</span>
                        </div>
                      ))}
                      {evsDia.length > 2 && (
                        <p className="text-[10px] text-gray-400 pl-1">+{evsDia.length - 2}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 mt-4">
        {TIPOS.map((t) => (
          <div key={t.value} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${t.cor}`} />
            <span className="text-xs text-gray-500">{t.label}</span>
          </div>
        ))}
      </div>

      {/* Empty state — sem eventos no mês */}
      {eventosFiltrados.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm mt-4">
          <EmptyState
            icon="📅"
            title="Nenhum evento agendado."
            subtitle="Clique em um dia no calendário para criar o primeiro evento."
          />
        </div>
      )}

      {/* ── Modal criar evento ── */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Novo evento</h3>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={salvarEvento} className="px-5 py-4 space-y-3">
              {/* Tipo */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {TIPOS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Turma */}
              {turmas.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Equipe</label>
                  <select
                    value={form.turma_id}
                    onChange={(e) => setForm({ ...form, turma_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Todas as equipes</option>
                    {turmas.map((t) => (
                      <option key={t.id} value={t.id}>{t.nome}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Data */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Data *</label>
                <input
                  required
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Horário */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Horário</label>
                <input
                  type="time"
                  value={form.horario}
                  onChange={(e) => setForm({ ...form, horario: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Local */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Local</label>
                <input
                  type="text"
                  value={form.local}
                  onChange={(e) => setForm({ ...form, local: e.target.value })}
                  placeholder="Ex: Campo principal"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Observação */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Observação</label>
                <textarea
                  value={form.observacao}
                  onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                  rows={2}
                  placeholder="Informações adicionais..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <button
                type="submit"
                disabled={salvando}
                className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {salvando ? 'Salvando...' : 'Criar evento'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal detalhe evento ── */}
      {eventoDetalhe && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${corParaTipo(eventoDetalhe.tipo)}`} />
                <h3 className="text-sm font-semibold text-gray-900">{labelParaTipo(eventoDetalhe.tipo)}</h3>
              </div>
              <button onClick={() => setEventoDetalhe(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(eventoDetalhe.data + 'T12:00:00').toLocaleDateString('pt-BR', {
                    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
                  })}
                </div>
                {eventoDetalhe.horario && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {eventoDetalhe.horario.slice(0, 5)}
                  </div>
                )}
                {eventoDetalhe.local && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {eventoDetalhe.local}
                  </div>
                )}
                {eventoDetalhe.turma_id && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {turmas.find((t) => t.id === eventoDetalhe.turma_id)?.nome ?? 'Equipe'}
                  </div>
                )}
                {eventoDetalhe.observacao && (
                  <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg px-3 py-2">
                    {eventoDetalhe.observacao}
                  </p>
                )}
              </div>

              <button
                onClick={() => excluirEvento(eventoDetalhe.id)}
                disabled={excluindo}
                className="w-full py-2 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 text-sm font-medium rounded-lg transition-colors"
              >
                {excluindo ? 'Excluindo...' : 'Excluir evento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
