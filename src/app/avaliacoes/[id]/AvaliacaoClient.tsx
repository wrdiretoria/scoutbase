'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const PILARES = ['Técnico', 'Físico', 'Tático', 'Comportamento'] as const
type Pilar = (typeof PILARES)[number]

type RawAvaliacao = {
  nota: number
  categoria: string
  data: string
}

type AvaliacaoGrupo = {
  data: string
  tecnico: number
  fisico: number
  tatico: number
  comportamento: number
  scoutScore: number
}

function groupAvaliacoes(rows: RawAvaliacao[]): AvaliacaoGrupo[] {
  const byDate: Record<string, Partial<Record<Pilar, number>>> = {}

  for (const row of rows) {
    const pilar = row.categoria as Pilar
    if (!PILARES.includes(pilar)) continue
    if (!byDate[row.data]) byDate[row.data] = {}
    if (byDate[row.data][pilar] === undefined) {
      byDate[row.data][pilar] = row.nota
    }
  }

  const result: AvaliacaoGrupo[] = []
  for (const [date, pilares] of Object.entries(byDate)) {
    if (
      pilares['Técnico'] !== undefined &&
      pilares['Físico'] !== undefined &&
      pilares['Tático'] !== undefined &&
      pilares['Comportamento'] !== undefined
    ) {
      const avg =
        (pilares['Técnico'] + pilares['Físico'] + pilares['Tático'] + pilares['Comportamento']) / 4
      result.push({
        data: date,
        tecnico: pilares['Técnico'],
        fisico: pilares['Físico'],
        tatico: pilares['Tático'],
        comportamento: pilares['Comportamento'],
        scoutScore: Math.round(avg * 10) / 10,
      })
    }
  }

  return result.sort((a, b) => b.data.localeCompare(a.data))
}

function getMonthKey(dateStr: string) {
  return dateStr.slice(0, 7)
}

// ─── Radar SVG ───────────────────────────────────────────────────────────────

const CX = 140
const CY = 140
const R = 90
const ANGLES = [-Math.PI / 2, 0, Math.PI / 2, Math.PI]
const LABEL_CONFIG = [
  { anchor: 'middle' as const, dx: 0, dy: -18 },
  { anchor: 'start' as const, dx: 18, dy: 4 },
  { anchor: 'middle' as const, dx: 0, dy: 18 },
  { anchor: 'end' as const, dx: -18, dy: 4 },
]

function radarPoint(value: number, angleIdx: number) {
  const r = (value / 10) * R
  return {
    x: CX + r * Math.cos(ANGLES[angleIdx]),
    y: CY + r * Math.sin(ANGLES[angleIdx]),
  }
}

function toPolygon(av: AvaliacaoGrupo) {
  const vals = [av.tecnico, av.fisico, av.tatico, av.comportamento]
  return vals.map((v, i) => {
    const p = radarPoint(v, i)
    return `${p.x},${p.y}`
  }).join(' ')
}

function RadarChart({
  current,
  previous,
}: {
  current: AvaliacaoGrupo | null
  previous: AvaliacaoGrupo | null
}) {
  const gridLevels = [0.25, 0.5, 0.75, 1.0]

  return (
    <svg width={280} height={280} viewBox="0 0 280 280" aria-hidden="true">
      {/* Grid rings */}
      {gridLevels.map((level) => {
        const pts = ANGLES.map((a) => {
          const r = level * R
          return `${CX + r * Math.cos(a)},${CY + r * Math.sin(a)}`
        }).join(' ')
        return (
          <polygon
            key={level}
            points={pts}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        )
      })}

      {/* Axis lines */}
      {ANGLES.map((a, i) => (
        <line
          key={i}
          x1={CX}
          y1={CY}
          x2={CX + R * Math.cos(a)}
          y2={CY + R * Math.sin(a)}
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      ))}

      {/* Previous month polygon */}
      {previous && (
        <polygon
          points={toPolygon(previous)}
          fill="rgba(156,163,175,0.25)"
          stroke="#9ca3af"
          strokeWidth="2"
          strokeDasharray="4,3"
        />
      )}

      {/* Current month polygon */}
      {current && (
        <polygon
          points={toPolygon(current)}
          fill="rgba(34,197,94,0.15)"
          stroke="#16a34a"
          strokeWidth="2"
        />
      )}

      {/* Dots — current */}
      {current &&
        [current.tecnico, current.fisico, current.tatico, current.comportamento].map((v, i) => {
          const p = radarPoint(v, i)
          return <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#16a34a" />
        })}

      {/* Dots — previous */}
      {previous &&
        [previous.tecnico, previous.fisico, previous.tatico, previous.comportamento].map((v, i) => {
          const p = radarPoint(v, i)
          return <circle key={i} cx={p.x} cy={p.y} r="3" fill="#9ca3af" />
        })}

      {/* Labels */}
      {PILARES.map((label, i) => {
        const lx = CX + (R + 16) * Math.cos(ANGLES[i]) + LABEL_CONFIG[i].dx
        const ly = CY + (R + 16) * Math.sin(ANGLES[i]) + LABEL_CONFIG[i].dy
        return (
          <text
            key={i}
            x={lx}
            y={ly}
            textAnchor={LABEL_CONFIG[i].anchor}
            fontSize="11"
            fill="#6b7280"
            fontFamily="sans-serif"
          >
            {label}
          </text>
        )
      })}
    </svg>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Props = {
  alunoId: string
  professorId: string
  rawAvaliacoes: RawAvaliacao[]
}

const DEFAULT_NOTAS: Record<Pilar, number> = {
  Técnico: 5,
  Físico: 5,
  Tático: 5,
  Comportamento: 5,
}

export default function AvaliacaoClient({ alunoId, professorId, rawAvaliacoes }: Props) {
  const router = useRouter()
  const [notas, setNotas] = useState<Record<Pilar, number>>({ ...DEFAULT_NOTAS })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const scoutScore = useMemo(
    () =>
      Math.round(
        (Object.values(notas).reduce((a, b) => a + b, 0) / PILARES.length) * 10
      ) / 10,
    [notas]
  )

  const avaliacoes = useMemo(() => groupAvaliacoes(rawAvaliacoes), [rawAvaliacoes])

  const thisMonth = useMemo(() => {
    const now = new Date().toISOString().slice(0, 7)
    return avaliacoes.find((a) => getMonthKey(a.data) === now) ?? null
  }, [avaliacoes])

  const prevMonth = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    const prev = d.toISOString().slice(0, 7)
    return avaliacoes.find((a) => getMonthKey(a.data) === prev) ?? null
  }, [avaliacoes])

  const scoreColor =
    scoutScore >= 7.5 ? 'text-green-600' : scoutScore >= 5 ? 'text-yellow-500' : 'text-red-500'

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    const rows = PILARES.map((pilar) => ({
      aluno_id: alunoId,
      professor_id: professorId,
      nota: notas[pilar],
      categoria: pilar,
      data: today,
    }))

    const { error: dbError } = await supabase.from('avaliacoes').insert(rows)

    if (dbError) {
      setError('Erro ao salvar. Tente novamente.')
    } else {
      setSuccess(true)
      router.refresh()
    }

    setSaving(false)
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold text-gray-900">Nova avaliação</h2>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-0.5">Scout Score</p>
            <p className={`text-3xl font-bold leading-none ${scoreColor}`}>{scoutScore}</p>
            <p className="text-xs text-gray-400 mt-0.5">de 10</p>
          </div>
        </div>

        <div className="space-y-5">
          {PILARES.map((pilar) => (
            <div key={pilar}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm text-gray-700 font-medium">{pilar}</label>
                <span className="text-sm font-semibold text-gray-900 w-6 text-right">
                  {notas[pilar]}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={notas[pilar]}
                onChange={(e) =>
                  setNotas((prev) => ({ ...prev, [pilar]: Number(e.target.value) }))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
              <div className="flex justify-between text-xs text-gray-300 mt-0.5">
                <span>0</span>
                <span>10</span>
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-red-500 mt-4">{error}</p>}
        {success && (
          <p className="text-sm text-green-600 mt-4">Avaliação salva com sucesso!</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
        >
          {saving ? 'Salvando…' : 'Salvar avaliação'}
        </button>
      </div>

      {/* Radar chart */}
      {(thisMonth || prevMonth) && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Evolução</h2>

          <div className="flex justify-center">
            <RadarChart current={thisMonth} previous={prevMonth} />
          </div>

          <div className="flex items-center justify-center gap-6 mt-2">
            {thisMonth && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-3 h-0.5 bg-green-600 inline-block rounded" />
                Mês atual
              </div>
            )}
            {prevMonth && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span
                  className="w-3 h-0.5 bg-gray-400 inline-block rounded"
                  style={{ borderTop: '2px dashed #9ca3af' }}
                />
                Mês anterior
              </div>
            )}
          </div>
        </div>
      )}

      {/* History */}
      {avaliacoes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Histórico</h2>
          <ul className="divide-y divide-gray-50">
            {avaliacoes.map((av, i) => (
              <li key={i} className="py-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-400">
                    {new Date(av.data).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <span
                    className={`text-sm font-bold ${
                      av.scoutScore >= 7.5
                        ? 'text-green-600'
                        : av.scoutScore >= 5
                        ? 'text-yellow-500'
                        : 'text-red-500'
                    }`}
                  >
                    {av.scoutScore} / 10
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {(
                    [
                      ['Téc', av.tecnico],
                      ['Fís', av.fisico],
                      ['Tát', av.tatico],
                      ['Com', av.comportamento],
                    ] as [string, number][]
                  ).map(([label, val]) => (
                    <div key={label} className="text-center">
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="text-sm font-semibold text-gray-800">{val}</p>
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
