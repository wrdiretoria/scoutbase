'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import PremiumModal from '@/components/PremiumModal'

// ── Types ─────────────────────────────────────────────────────────────────────

type CriterioId =
  | 'passe_curto' | 'passe_longo' | 'dominio_direito' | 'dominio_esquerdo'
  | 'tempo_bola' | 'conducao' | 'cabecio' | 'finalizacao'
  | 'velocidade' | 'forca' | 'impulsao' | 'mudanca_direcao' | 'coordenacao'
  | 'visao_jogo' | 'posicionamento' | 'cap_defender' | 'cap_atacar'
  | 'atitude' | 'pressao' | 'lideranca' | 'concentracao' | 'colaboracao' | 'disciplina'

type Notas = Record<CriterioId, number>

type RawAvaliacao = {
  tecnico: number
  fisico: number
  tatico: number
  comportamento: number
  scout_score: number | null
  created_at: string
}

type AvaliacaoGrupo = {
  created_at: string
  tecnico: number
  fisico: number
  tatico: number
  comportamento: number
  scoutScore: number
}

// ── Category config ───────────────────────────────────────────────────────────

type Cor = {
  header: string
  headerText: string
  selected: string
  hover: string
  badge: string
}

type Categoria = {
  id: string
  emoji: string
  label: string
  peso: number
  cor: Cor
  criterios: { id: CriterioId; label: string }[]
}

const CATEGORIAS: Categoria[] = [
  {
    id: 'tecnico',
    emoji: '🔵',
    label: 'Técnico',
    peso: 0.35,
    cor: {
      header: 'bg-blue-500',
      headerText: 'text-white',
      selected: 'bg-blue-500 text-white shadow-sm',
      hover: 'hover:bg-blue-50 hover:text-blue-600',
      badge: 'bg-blue-100 text-blue-700',
    },
    criterios: [
      { id: 'passe_curto',      label: 'Passe curto' },
      { id: 'passe_longo',      label: 'Passe longo' },
      { id: 'dominio_direito',  label: 'Domínio de bola direito' },
      { id: 'dominio_esquerdo', label: 'Domínio de bola esquerdo' },
      { id: 'tempo_bola',       label: 'Tempo de bola' },
      { id: 'conducao',         label: 'Condução de bola' },
      { id: 'cabecio',          label: 'Cabeceio' },
      { id: 'finalizacao',      label: 'Finalização' },
    ],
  },
  {
    id: 'fisico',
    emoji: '🟢',
    label: 'Físico',
    peso: 0.25,
    cor: {
      header: 'bg-green-500',
      headerText: 'text-white',
      selected: 'bg-green-500 text-white shadow-sm',
      hover: 'hover:bg-green-50 hover:text-green-600',
      badge: 'bg-green-100 text-green-700',
    },
    criterios: [
      { id: 'velocidade',       label: 'Velocidade' },
      { id: 'forca',            label: 'Força' },
      { id: 'impulsao',         label: 'Impulsão' },
      { id: 'mudanca_direcao',  label: 'Mudança de direção' },
      { id: 'coordenacao',      label: 'Coordenação motora' },
    ],
  },
  {
    id: 'tatico',
    emoji: '🟣',
    label: 'Tático',
    peso: 0.25,
    cor: {
      header: 'bg-purple-500',
      headerText: 'text-white',
      selected: 'bg-purple-500 text-white shadow-sm',
      hover: 'hover:bg-purple-50 hover:text-purple-600',
      badge: 'bg-purple-100 text-purple-700',
    },
    criterios: [
      { id: 'visao_jogo',       label: 'Visão de jogo' },
      { id: 'posicionamento',   label: 'Posicionamento' },
      { id: 'cap_defender',     label: 'Capacidade de defender' },
      { id: 'cap_atacar',       label: 'Capacidade de atacar' },
    ],
  },
  {
    id: 'comportamento',
    emoji: '🟠',
    label: 'Comportamento',
    peso: 0.15,
    cor: {
      header: 'bg-orange-500',
      headerText: 'text-white',
      selected: 'bg-orange-500 text-white shadow-sm',
      hover: 'hover:bg-orange-50 hover:text-orange-600',
      badge: 'bg-orange-100 text-orange-700',
    },
    criterios: [
      { id: 'atitude',      label: 'Atitude e trabalho' },
      { id: 'pressao',      label: 'Relação com pressão' },
      { id: 'lideranca',    label: 'Liderança' },
      { id: 'concentracao', label: 'Concentração' },
      { id: 'colaboracao',  label: 'Colaboração / Trabalho em equipe' },
      { id: 'disciplina',   label: 'Disciplina e respeito' },
    ],
  },
]

const DEFAULT_NOTAS: Notas = {
  passe_curto: 5, passe_longo: 5, dominio_direito: 5, dominio_esquerdo: 5,
  tempo_bola: 5, conducao: 5, cabecio: 5, finalizacao: 5,
  velocidade: 5, forca: 5, impulsao: 5, mudanca_direcao: 5, coordenacao: 5,
  visao_jogo: 5, posicionamento: 5, cap_defender: 5, cap_atacar: 5,
  atitude: 5, pressao: 5, lideranca: 5, concentracao: 5, colaboracao: 5, disciplina: 5,
}

// ── Score helpers ─────────────────────────────────────────────────────────────

function avgCat(notas: Notas, cat: Categoria): number {
  const vals = cat.criterios.map((c) => notas[c.id])
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function calcScoutScore(notas: Notas): number {
  const weighted = CATEGORIAS.reduce((sum, cat) => sum + avgCat(notas, cat) * cat.peso, 0)
  return Math.round(weighted * 10) / 10
}

function scoreColor(s: number) {
  return s >= 7.5 ? 'text-green-600' : s >= 5 ? 'text-yellow-500' : 'text-red-500'
}

// ── History helpers ───────────────────────────────────────────────────────────

function mapAvaliacoes(rows: RawAvaliacao[]): AvaliacaoGrupo[] {
  return rows.map((r) => ({
    created_at: r.created_at,
    tecnico: r.tecnico ?? 0,
    fisico: r.fisico ?? 0,
    tatico: r.tatico ?? 0,
    comportamento: r.comportamento ?? 0,
    scoutScore:
      r.scout_score !== null
        ? r.scout_score / 10
        : Math.round(((r.tecnico + r.fisico + r.tatico + r.comportamento) / 4) * 10) / 10,
  }))
}

function getMonthKey(dateStr: string) {
  return dateStr.slice(0, 7)
}

// ── Radar SVG ─────────────────────────────────────────────────────────────────

const CX = 140, CY = 140, R = 90
const ANGLES = [-Math.PI / 2, 0, Math.PI / 2, Math.PI]
const LABEL_CONFIG = [
  { anchor: 'middle' as const, dx: 0, dy: -18 },
  { anchor: 'start'  as const, dx: 18, dy: 4 },
  { anchor: 'middle' as const, dx: 0, dy: 18 },
  { anchor: 'end'    as const, dx: -18, dy: 4 },
]
const RADAR_LABELS = ['Técnico', 'Físico', 'Tático', 'Comportamento']

function radarPoint(value: number, idx: number) {
  const r = (value / 10) * R
  return { x: CX + r * Math.cos(ANGLES[idx]), y: CY + r * Math.sin(ANGLES[idx]) }
}

function toPolygon(av: AvaliacaoGrupo) {
  return [av.tecnico, av.fisico, av.tatico, av.comportamento]
    .map((v, i) => { const p = radarPoint(v, i); return `${p.x},${p.y}` })
    .join(' ')
}

function RadarChart({ current, previous }: { current: AvaliacaoGrupo | null; previous: AvaliacaoGrupo | null }) {
  const gridLevels = [0.25, 0.5, 0.75, 1.0]
  return (
    <svg width={280} height={280} viewBox="0 0 280 280" aria-hidden="true">
      {gridLevels.map((level) => {
        const pts = ANGLES.map((a) => `${CX + level * R * Math.cos(a)},${CY + level * R * Math.sin(a)}`).join(' ')
        return <polygon key={level} points={pts} fill="none" stroke="#e5e7eb" strokeWidth="1" />
      })}
      {ANGLES.map((a, i) => (
        <line key={i} x1={CX} y1={CY} x2={CX + R * Math.cos(a)} y2={CY + R * Math.sin(a)} stroke="#e5e7eb" strokeWidth="1" />
      ))}
      {previous && <polygon points={toPolygon(previous)} fill="rgba(156,163,175,0.25)" stroke="#9ca3af" strokeWidth="2" strokeDasharray="4,3" />}
      {current  && <polygon points={toPolygon(current)}  fill="rgba(34,197,94,0.15)"   stroke="#16a34a" strokeWidth="2" />}
      {current  && [current.tecnico, current.fisico, current.tatico, current.comportamento].map((v, i) => {
        const p = radarPoint(v, i); return <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#16a34a" />
      })}
      {previous && [previous.tecnico, previous.fisico, previous.tatico, previous.comportamento].map((v, i) => {
        const p = radarPoint(v, i); return <circle key={i} cx={p.x} cy={p.y} r="3" fill="#9ca3af" />
      })}
      {RADAR_LABELS.map((label, i) => {
        const lx = CX + (R + 16) * Math.cos(ANGLES[i]) + LABEL_CONFIG[i].dx
        const ly = CY + (R + 16) * Math.sin(ANGLES[i]) + LABEL_CONFIG[i].dy
        return <text key={i} x={lx} y={ly} textAnchor={LABEL_CONFIG[i].anchor} fontSize="11" fill="#6b7280" fontFamily="sans-serif">{label}</text>
      })}
    </svg>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

const TRIAL_LIMITE = 3

const BASE_URL = 'https://scoutbase-eta.vercel.app' // TODO: trocar pelo domínio final quando tiver

type Props = {
  alunoId: string
  alunoNome: string
  scoutId: string | null
  professorId: string
  rawAvaliacoes: RawAvaliacao[]
  trialUsadas: number
  isPremium: boolean
}

export default function AvaliacaoClient({ alunoId, alunoNome, scoutId, professorId, rawAvaliacoes, trialUsadas, isPremium }: Props) {
  const router = useRouter()
  const [notas, setNotas] = useState<Notas>({ ...DEFAULT_NOTAS })
  const [observacao, setObservacao] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [trialLocal, setTrialLocal] = useState(trialUsadas)
  const [showPremiumModal, setShowPremiumModal] = useState(false)

  const linkPublico = scoutId
    ? `${BASE_URL}/atleta/${scoutId}`
    : `${BASE_URL}/alunos/${alunoId}`

  async function copiarLink() {
    await navigator.clipboard.writeText(linkPublico)
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 2500)
  }

  function compartilharWhatsApp() {
    const msg = encodeURIComponent(
      `📊 Confira o relatório de evolução de *${alunoNome}* no ScoutBase:\n${linkPublico}`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  const bloqueado = !isPremium && trialLocal >= TRIAL_LIMITE

  const scoutScore = useMemo(() => calcScoutScore(notas), [notas])

  const avaliacoes = useMemo(() => mapAvaliacoes(rawAvaliacoes), [rawAvaliacoes])

  const thisMonth = useMemo(() => {
    const now = new Date().toISOString().slice(0, 7)
    return avaliacoes.find((a) => getMonthKey(a.created_at) === now) ?? null
  }, [avaliacoes])

  const prevMonth = useMemo(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1)
    return avaliacoes.find((a) => getMonthKey(a.created_at) === d.toISOString().slice(0, 7)) ?? null
  }, [avaliacoes])

  function setNota(id: CriterioId, val: number) {
    setNotas((prev) => ({ ...prev, [id]: val }))
    setSuccess(false)
  }

  async function handleSave() {
    // ── Trial gate ──────────────────────────────────────────────────────────
    if (bloqueado) {
      setShowPremiumModal(true)
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()

    // Category averages (stored in existing columns, 1–10 scale)
    const tecnico       = Math.round(avgCat(notas, CATEGORIAS[0]) * 10) / 10
    const fisico        = Math.round(avgCat(notas, CATEGORIAS[1]) * 10) / 10
    const tatico        = Math.round(avgCat(notas, CATEGORIAS[2]) * 10) / 10
    const comportamento = Math.round(avgCat(notas, CATEGORIAS[3]) * 10) / 10
    const scout_score   = Math.round(scoutScore * 10) // stored 0–100

    const { error: dbError } = await supabase.from('avaliacoes').insert({
      aluno_id: alunoId,
      professor_id: professorId,
      tecnico, fisico, tatico, comportamento, scout_score,
      ...notas,
      observacao: observacao.trim() || null,
    })

    if (dbError) {
      setError(`${dbError.message} [${dbError.code}]`)
    } else {
      setSuccess(true)
      router.refresh()
      // Increment trial counter (fire-and-forget)
      if (!isPremium) {
        fetch('/api/freemium/incrementar', { method: 'POST' }).catch(() => null)
        setTrialLocal((prev) => prev + 1)
      }
    }
    setSaving(false)
  }

  return (
    <div className="space-y-5 pb-32">

      {/* ── Trial counter ── */}
      {!isPremium && (
        <div className={`flex items-center gap-3 rounded-[20px] px-4 py-3 border ${
          bloqueado
            ? 'bg-red-50 border-red-200'
            : trialLocal >= TRIAL_LIMITE - 1
            ? 'bg-amber-50 border-amber-200'
            : 'bg-green-50 border-green-100'
        }`}>
          <span className="text-lg shrink-0">🎯</span>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${bloqueado ? 'text-red-800' : 'text-gray-800'}`}>
              {trialLocal} de {TRIAL_LIMITE} avaliações gratuitas usadas
            </p>
            {bloqueado && (
              <p className="text-xs text-red-600 mt-0.5">Assine para continuar avaliando</p>
            )}
          </div>
          {/* Progress dots */}
          <div className="flex gap-1 shrink-0">
            {Array.from({ length: TRIAL_LIMITE }).map((_, i) => (
              <span
                key={i}
                className={`w-2.5 h-2.5 rounded-full ${
                  i < trialLocal
                    ? bloqueado ? 'bg-red-400' : 'bg-green-500'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Scout Score live ── */}
      <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm px-6 py-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">Nova avaliação</p>
          <p className="text-xs text-gray-400 mt-0.5">Preencha todos os critérios</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-0.5">Scout Score</p>
          <p className={`text-4xl font-bold leading-none ${scoreColor(scoutScore)}`}>{scoutScore.toFixed(1)}</p>
          <p className="text-xs text-gray-400 mt-0.5">de 10</p>
        </div>
      </div>

      {/* ── Category cards ── */}
      {CATEGORIAS.map((cat) => (
        <div key={cat.id} className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className={`${cat.cor.header} px-5 py-3 flex items-center justify-between`}>
            <p className="text-white font-bold text-sm">{cat.emoji} {cat.label}</p>
            <span className="bg-white/20 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              peso {Math.round(cat.peso * 100)}%
            </span>
          </div>

          {/* Criteria */}
          <div className="divide-y divide-gray-50">
            {cat.criterios.map((crit) => {
              const nota = notas[crit.id]
              return (
                <div key={crit.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="text-sm font-medium text-gray-700">{crit.label}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${nota > 0 ? cat.cor.badge : 'bg-gray-100 text-gray-400'}`}>
                      {nota}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 md:grid-cols-10 gap-1.5 md:gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <button
                        key={n}
                        onClick={() => setNota(crit.id, n)}
                        className={`py-3 md:py-2.5 rounded-lg text-sm md:text-xs font-bold transition-all min-h-[44px] md:min-h-0 ${
                          nota === n
                            ? cat.cor.selected
                            : `bg-gray-50 text-gray-400 border border-gray-100 ${cat.cor.hover}`
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Category avg */}
          <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50 flex justify-end">
            <p className="text-xs text-gray-400">
              Média: <span className="font-bold text-gray-700">{avgCat(notas, cat).toFixed(1)}</span>
            </p>
          </div>
        </div>
      ))}

      {/* ── Observação ── */}
      <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm px-5 py-5">
        <label className="block text-sm font-semibold text-gray-900 mb-2">Observação geral</label>
        <textarea
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          rows={3}
          placeholder="Pontos de destaque, áreas para desenvolver, notas do treino…"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
        />
      </div>

      {/* ── Feedback ── */}
      {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-[20px] px-5 py-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">✅</span>
            <p className="text-sm font-semibold text-green-800">Avaliação salva com sucesso!</p>
          </div>
          <p className="text-xs text-green-700 font-mono bg-white/70 px-3 py-1.5 rounded-lg truncate">
            {linkPublico}
          </p>
          <div className="flex gap-2.5">
            {/* Copiar link */}
            <button
              onClick={copiarLink}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
            >
              {linkCopiado ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copiado!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Compartilhar relatório
                </>
              )}
            </button>

            {/* WhatsApp */}
            <button
              onClick={compartilharWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-green-300 text-green-700 hover:bg-green-50 text-sm font-semibold transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Enviar via WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* ── Save button ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg px-4 py-4 z-40 md:left-56">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-3.5 rounded-[20px] text-white text-sm font-bold transition-colors shadow-sm disabled:opacity-50 ${
            bloqueado
              ? 'bg-amber-500 hover:bg-amber-600'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {saving
            ? 'Salvando…'
            : bloqueado
            ? '⭐ Assinar para avaliar'
            : `Salvar avaliação — Scout Score ${scoutScore.toFixed(1)}`}
        </button>
      </div>

      {/* ── Premium modal ── */}
      {showPremiumModal && (
        <PremiumModal
          funcao="Avaliações ilimitadas"
          descricao="Você usou suas 3 avaliações gratuitas. Assine para avaliar todos os seus atletas ilimitadamente."
          onClose={() => setShowPremiumModal(false)}
        />
      )}

      {/* ── Radar chart ── */}
      {(thisMonth || prevMonth) && (
        <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Evolução</h2>
          <div className="flex justify-center">
            <RadarChart current={thisMonth} previous={prevMonth} />
          </div>
          <div className="flex items-center justify-center gap-6 mt-2">
            {thisMonth && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-3 h-0.5 bg-green-600 inline-block rounded" /> Mês atual
              </div>
            )}
            {prevMonth && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-3 h-0.5 bg-gray-400 inline-block rounded" style={{ borderTop: '2px dashed #9ca3af' }} />
                Mês anterior
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── History ── */}
      {avaliacoes.length > 0 && (
        <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Histórico</h2>
          <ul className="divide-y divide-gray-50">
            {avaliacoes.map((av, i) => (
              <li key={i} className="py-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-400">
                    {new Date(av.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  <span className={`text-sm font-bold ${scoreColor(av.scoutScore)}`}>
                    {av.scoutScore.toFixed(1)} / 10
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {([['Téc', av.tecnico], ['Fís', av.fisico], ['Tát', av.tatico], ['Com', av.comportamento]] as [string, number][]).map(([label, val]) => (
                    <div key={label} className="text-center">
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="text-sm font-semibold text-gray-800">{typeof val === 'number' ? val.toFixed(1) : val}</p>
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
