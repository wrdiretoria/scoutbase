import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'

type Props = {
  params: Promise<{ sid: string }>
}

const PILARES = ['Técnico', 'Físico', 'Tático', 'Comportamento'] as const
const CX = 140, CY = 140, R = 90
const ANGLES = [-Math.PI / 2, 0, Math.PI / 2, Math.PI]
const LABEL_CONFIG = [
  { anchor: 'middle', dx: 0, dy: -18 },
  { anchor: 'start', dx: 18, dy: 4 },
  { anchor: 'middle', dx: 0, dy: 18 },
  { anchor: 'end', dx: -18, dy: 4 },
]

type Notas = { tecnico: number; fisico: number; tatico: number; comportamento: number }

function radarPt(value: number, idx: number) {
  const r = (value / 10) * R
  return { x: CX + r * Math.cos(ANGLES[idx]), y: CY + r * Math.sin(ANGLES[idx]) }
}

function toPoints(n: Notas) {
  return [n.tecnico, n.fisico, n.tatico, n.comportamento]
    .map((v, i) => { const p = radarPt(v, i); return `${p.x},${p.y}` })
    .join(' ')
}

function RadarSVG({ notas }: { notas: Notas }) {
  return (
    <svg width={280} height={280} viewBox="0 0 280 280" aria-hidden="true">
      {[0.25, 0.5, 0.75, 1.0].map((level) => {
        const pts = ANGLES.map((a) => `${CX + level * R * Math.cos(a)},${CY + level * R * Math.sin(a)}`).join(' ')
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

export default async function AtletaPublicoPage({ params }: Props) {
  const { sid } = await params
  const supabase = await createServerClient()

  const { data: aluno } = await supabase
    .from('alunos')
    .select('id, nome, posicao, scout_id, turmas(nome)')
    .eq('scout_id', sid.toUpperCase())
    .single()

  if (!aluno) notFound()

  const { data: avaliacoes } = await supabase
    .from('avaliacoes')
    .select('tecnico, fisico, tatico, comportamento, scout_score, created_at')
    .eq('aluno_id', aluno.id)
    .order('created_at', { ascending: false })

  const { data: presencas } = await supabase
    .from('presencas')
    .select('presente')
    .eq('aluno_id', aluno.id)

  const ultimaAvaliacao = avaliacoes?.[0] ?? null
  const scores = (avaliacoes ?? []).map(a => a.scout_score).filter(Boolean) as number[]
  const scoutScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null

  const totalPresencas = presencas?.length ?? 0
  const presentes = presencas?.filter((p) => p.presente).length ?? 0
  const frequencia = totalPresencas > 0 ? Math.round((presentes / totalPresencas) * 100) : null

  const turmaNome = aluno.turmas && !Array.isArray(aluno.turmas)
    ? (aluno.turmas as { nome: string }).nome
    : null

  const scoreColor = scoutScore === null ? 'text-gray-300'
    : scoutScore >= 75 ? 'text-green-600'
    : scoutScore >= 50 ? 'text-yellow-500'
    : 'text-red-500'

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-md mx-auto space-y-4">

        {/* Scout ID Badge */}
        <div className="bg-green-900 rounded-2xl p-5 text-white shadow-lg">
          <p className="text-xs font-semibold tracking-[0.2em] text-green-300 uppercase mb-1">Scout ID</p>
          <p className="text-3xl font-black tracking-widest font-mono text-white leading-none mb-3">
            {aluno.scout_id}
          </p>
          <div className="border-t border-green-700 pt-3">
            <p className="text-base font-semibold text-white">{aluno.nome}</p>
            {aluno.posicao && <p className="text-xs text-green-300 mt-0.5">{aluno.posicao}</p>}
            {turmaNome && <p className="text-xs text-green-400 mt-0.5">{turmaNome}</p>}
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400">Scout Score</p>
            <p className={`text-3xl font-bold mt-1 ${scoreColor}`}>
              {scoutScore ?? '—'}
            </p>
            {scoutScore !== null && <p className="text-xs text-gray-400">de 100</p>}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400">Frequência</p>
            <p className={`text-3xl font-bold mt-1 ${
              frequencia === null ? 'text-gray-300' : frequencia >= 75 ? 'text-green-600' : 'text-red-500'
            }`}>
              {frequencia !== null ? `${frequencia}%` : '—'}
            </p>
            {totalPresencas > 0 && <p className="text-xs text-gray-400">{presentes}/{totalPresencas} aulas</p>}
          </div>
        </div>

        {/* Radar */}
        {ultimaAvaliacao && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Última avaliação</h2>
              <p className="text-xs text-gray-400">
                {new Date(ultimaAvaliacao.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })}
              </p>
            </div>
            <div className="flex justify-center">
              <RadarSVG notas={{
                tecnico: ultimaAvaliacao.tecnico,
                fisico: ultimaAvaliacao.fisico,
                tatico: ultimaAvaliacao.tatico,
                comportamento: ultimaAvaliacao.comportamento,
              }} />
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3">
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
