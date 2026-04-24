import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'

type Props = {
  params: Promise<{ token: string }>
}

// ─── Radar helpers ─────────────────────────────────────────────────────────────

const PILARES = ['Técnico', 'Físico', 'Tático', 'Comportamento'] as const
const CX = 140
const CY = 140
const R = 90
const ANGLES = [-Math.PI / 2, 0, Math.PI / 2, Math.PI]
const LABEL_CONFIG = [
  { anchor: 'middle', dx: 0, dy: -18 },
  { anchor: 'start', dx: 18, dy: 4 },
  { anchor: 'middle', dx: 0, dy: 18 },
  { anchor: 'end', dx: -18, dy: 4 },
]

function radarPt(value: number, idx: number) {
  const r = (value / 10) * R
  return { x: CX + r * Math.cos(ANGLES[idx]), y: CY + r * Math.sin(ANGLES[idx]) }
}

type Notas = { tecnico: number; fisico: number; tatico: number; comportamento: number }

function toPoints(n: Notas) {
  return [n.tecnico, n.fisico, n.tatico, n.comportamento]
    .map((v, i) => { const p = radarPt(v, i); return `${p.x},${p.y}` })
    .join(' ')
}

function RadarSVG({ notas }: { notas: Notas }) {
  const gridLevels = [0.25, 0.5, 0.75, 1.0]
  return (
    <svg width={280} height={280} viewBox="0 0 280 280" aria-hidden="true">
      {gridLevels.map((level) => {
        const pts = ANGLES.map((a) => {
          const r = level * R
          return `${CX + r * Math.cos(a)},${CY + r * Math.sin(a)}`
        }).join(' ')
        return <polygon key={level} points={pts} fill="none" stroke="#e5e7eb" strokeWidth="1" />
      })}
      {ANGLES.map((a, i) => (
        <line key={i} x1={CX} y1={CY} x2={CX + R * Math.cos(a)} y2={CY + R * Math.sin(a)} stroke="#e5e7eb" strokeWidth="1" />
      ))}
      <polygon points={toPoints(notas)} fill="rgba(34,197,94,0.15)" stroke="#16a34a" strokeWidth="2" />
      {[notas.tecnico, notas.fisico, notas.tatico, notas.comportamento].map((v, i) => {
        const p = radarPt(v, i)
        return <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#16a34a" />
      })}
      {PILARES.map((label, i) => {
        const cfg = LABEL_CONFIG[i]
        const lx = CX + (R + 16) * Math.cos(ANGLES[i]) + cfg.dx
        const ly = CY + (R + 16) * Math.sin(ANGLES[i]) + cfg.dy
        return (
          <text key={i} x={lx} y={ly} textAnchor={cfg.anchor as 'middle' | 'start' | 'end'} fontSize="11" fill="#6b7280" fontFamily="sans-serif">
            {label}
          </text>
        )
      })}
    </svg>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function PublicPerfilPage({ params }: Props) {
  const { token } = await params
  const supabase = await createServerClient()

  const { data: aluno } = await supabase
    .from('alunos')
    .select('id, nome, posicao, turmas(nome)')
    .eq('token_acesso', token)
    .single()

  if (!aluno) notFound()

  const { data: avaliacoes } = await supabase
    .from('avaliacoes')
    .select('nota, categoria, data')
    .eq('aluno_id', aluno.id)
    .order('data', { ascending: false })

  const { data: presencas } = await supabase
    .from('presencas')
    .select('presente')
    .eq('aluno_id', aluno.id)

  // Scout Score (média dos 4 pilares da avaliação mais recente agrupada)
  const byDate: Record<string, Record<string, number>> = {}
  for (const av of avaliacoes ?? []) {
    if (!byDate[av.data]) byDate[av.data] = {}
    if (byDate[av.data][av.categoria] === undefined) byDate[av.data][av.categoria] = av.nota
  }

  type Grupo = { data: string; tecnico: number; fisico: number; tatico: number; comportamento: number; score: number }
  const grupos: Grupo[] = []
  for (const [date, pilares] of Object.entries(byDate)) {
    const t = pilares['Técnico']
    const f = pilares['Físico']
    const ta = pilares['Tático']
    const c = pilares['Comportamento']
    if (t !== undefined && f !== undefined && ta !== undefined && c !== undefined) {
      grupos.push({
        data: date,
        tecnico: t,
        fisico: f,
        tatico: ta,
        comportamento: c,
        score: Math.round(((t + f + ta + c) / 4) * 10) / 10,
      })
    }
  }
  grupos.sort((a, b) => b.data.localeCompare(a.data))

  const ultimaAvaliacao = grupos[0] ?? null
  const scoutScore = ultimaAvaliacao?.score ?? null

  const totalPresencas = presencas?.length ?? 0
  const presentes = presencas?.filter((p) => p.presente).length ?? 0
  const frequencia = totalPresencas > 0 ? Math.round((presentes / totalPresencas) * 100) : null

  const turmaNome =
    aluno.turmas && !Array.isArray(aluno.turmas)
      ? (aluno.turmas as { nome: string }).nome
      : null

  const scoreColor =
    scoutScore === null
      ? 'text-gray-300'
      : scoutScore >= 7.5
      ? 'text-green-600'
      : scoutScore >= 5
      ? 'text-yellow-500'
      : 'text-red-500'

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto space-y-5">

        {/* Header identidade */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Relatório do Atleta</p>
              <h1 className="text-2xl font-bold text-gray-900 truncate">{aluno.nome}</h1>
              {aluno.posicao && <p className="text-sm text-gray-500 mt-0.5">{aluno.posicao}</p>}
              {turmaNome && <p className="text-xs text-gray-400 mt-0.5">{turmaNome}</p>}
            </div>
            <div className="text-center flex-shrink-0">
              <p className="text-xs text-gray-400 mb-1">Scout Score</p>
              <p className={`text-5xl font-bold leading-none ${scoreColor}`}>
                {scoutScore ?? '—'}
              </p>
              {scoutScore !== null && <p className="text-xs text-gray-400 mt-1">de 10</p>}
            </div>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400">Frequência</p>
            <p className={`text-2xl font-bold mt-1 ${
              frequencia === null ? 'text-gray-300' : frequencia >= 75 ? 'text-green-600' : 'text-red-500'
            }`}>
              {frequencia !== null ? `${frequencia}%` : '—'}
            </p>
            {totalPresencas > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">{presentes}/{totalPresencas} aulas</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400">Avaliações</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{grupos.length}</p>
          </div>
        </div>

        {/* Radar da última avaliação */}
        {ultimaAvaliacao && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Última avaliação</h2>
              <p className="text-xs text-gray-400">
                {new Date(ultimaAvaliacao.data).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>

            <div className="flex justify-center">
              <RadarSVG notas={ultimaAvaliacao} />
            </div>

            <div className="grid grid-cols-4 gap-2 mt-4">
              {([
                ['Téc', ultimaAvaliacao.tecnico],
                ['Fís', ultimaAvaliacao.fisico],
                ['Tát', ultimaAvaliacao.tatico],
                ['Com', ultimaAvaliacao.comportamento],
              ] as [string, number][]).map(([label, val]) => (
                <div key={label} className="text-center bg-gray-50 rounded-lg py-2">
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-semibold text-gray-800">{val}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!ultimaAvaliacao && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="text-gray-400 text-sm">Nenhuma avaliação registrada ainda.</p>
          </div>
        )}

        <p className="text-center text-xs text-gray-300 pb-4">Gerado pelo ScoutBase</p>
      </div>
    </main>
  )
}
