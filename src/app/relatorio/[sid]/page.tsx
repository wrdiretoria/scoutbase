/**
 * /relatorio/[sid] — Página pública do relatório do atleta
 * Acessível sem login. Mostra perfil completo e dados verificados.
 */

import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'

type Props = { params: Promise<{ sid: string }> }

const ANGLES = [-Math.PI / 2, 0, Math.PI / 2, Math.PI]
const CX = 90, CY = 90, R = 65

function radarPt(val: number, idx: number) {
  const r = (val / 10) * R
  return { x: CX + r * Math.cos(ANGLES[idx]), y: CY + r * Math.sin(ANGLES[idx]) }
}

function toPoints(t: number, f: number, ta: number, c: number) {
  return [t, f, ta, c].map((v, i) => { const p = radarPt(v, i); return `${p.x},${p.y}` }).join(' ')
}

function ScoreBar({ label, val, cor }: { label: string; val: number; cor: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500 w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full ${cor}`} style={{ width: `${(val / 10) * 100}%` }} />
      </div>
      <span className="text-sm font-bold text-gray-700 w-8 text-right">{val.toFixed(1)}</span>
    </div>
  )
}

export default async function RelatorioPublicoPage({ params }: Props) {
  const { sid } = await params
  const supabase = await createServerClient()

  // Fetch athlete by scout_id (public, no auth filter)
  const { data: aluno } = await supabase
    .from('alunos')
    .select('id, nome, posicao, scout_id, data_nascimento')
    .eq('scout_id', sid)
    .single()

  if (!aluno) notFound()

  // Fetch last 2 evaluations for score + evolution
  const { data: avaliacoes } = await supabase
    .from('avaliacoes')
    .select('tecnico, fisico, tatico, comportamento, scout_score, created_at')
    .eq('aluno_id', aluno.id)
    .order('created_at', { ascending: false })
    .limit(2)

  const ultima   = avaliacoes?.[0] ?? null
  const anterior = avaliacoes?.[1] ?? null

  const scoutScore   = ultima?.scout_score ? (ultima.scout_score / 10).toFixed(1) : null
  const scoreAnterior = anterior?.scout_score ? (anterior.scout_score / 10).toFixed(1) : null
  const evolucao = ultima?.scout_score && anterior?.scout_score
    ? ((ultima.scout_score - anterior.scout_score) / 10).toFixed(1)
    : null

  const geradoEm = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  function getInitials(nome: string) {
    return nome.split(' ').slice(0, 2).map((n: string) => n[0] ?? '').join('').toUpperCase()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto space-y-5">

        {/* Header ScoutBase */}
        <div className="text-center mb-2">
          <span className="text-2xl font-black text-green-600 tracking-wide">ScoutBase</span>
          <p className="text-xs text-gray-400 mt-0.5">Plataforma de gestão de atletas</p>
        </div>

        {/* Card principal */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Stripe */}
          <div className="h-1.5 bg-gradient-to-r from-[#16a34a] to-green-400" />

          <div className="p-6">
            {/* Athlete identity */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-green-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                {getInitials(aluno.nome)}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-900">{aluno.nome}</h1>
                <p className="text-sm text-gray-500">{aluno.posicao ?? 'Posição não informada'}</p>
                {aluno.scout_id && (
                  <p className="text-xs font-mono text-green-600 mt-0.5">{aluno.scout_id}</p>
                )}
              </div>
              {scoutScore && (
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-400">Scout Score</p>
                  <p className="text-3xl font-black text-green-600 leading-none">{scoutScore}</p>
                  <p className="text-xs text-gray-300">/10</p>
                </div>
              )}
            </div>

            {/* Evolução badge */}
            {evolucao !== null && (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-5 ${
                parseFloat(evolucao) >= 0
                  ? 'bg-green-50 text-green-700 border border-green-100'
                  : 'bg-red-50 text-red-600 border border-red-100'
              }`}>
                {parseFloat(evolucao) >= 0 ? '↑' : '↓'} Evolução: {scoreAnterior} → {scoutScore}
              </div>
            )}

            {/* Radar */}
            {ultima && (
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
                <svg width={180} height={180} viewBox="0 0 180 180" className="flex-shrink-0">
                  {[0.25, 0.5, 0.75, 1.0].map((lv) => {
                    const pts = ANGLES.map((a) => `${CX + lv * R * Math.cos(a)},${CY + lv * R * Math.sin(a)}`).join(' ')
                    return <polygon key={lv} points={pts} fill="none" stroke="#e5e7eb" strokeWidth="1" />
                  })}
                  {ANGLES.map((a, i) => (
                    <line key={i} x1={CX} y1={CY} x2={CX + R * Math.cos(a)} y2={CY + R * Math.sin(a)} stroke="#e5e7eb" strokeWidth="1" />
                  ))}
                  <polygon
                    points={toPoints(ultima.tecnico, ultima.fisico, ultima.tatico, ultima.comportamento)}
                    fill="rgba(22,163,74,0.15)"
                    stroke="#16a34a"
                    strokeWidth="2"
                  />
                  {[ultima.tecnico, ultima.fisico, ultima.tatico, ultima.comportamento].map((v, i) => {
                    const p = radarPt(v, i)
                    return <circle key={i} cx={p.x} cy={p.y} r="4" fill="#16a34a" />
                  })}
                  {['Técnico','Físico','Tático','Comport.'].map((lbl, i) => {
                    const lx = CX + (R + 18) * Math.cos(ANGLES[i])
                    const ly = CY + (R + 18) * Math.sin(ANGLES[i])
                    return <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#9ca3af">{lbl}</text>
                  })}
                </svg>

                <div className="flex-1 w-full space-y-3">
                  <ScoreBar label="Técnico"       val={ultima.tecnico}       cor="bg-blue-500" />
                  <ScoreBar label="Físico"         val={ultima.fisico}        cor="bg-green-500" />
                  <ScoreBar label="Tático"         val={ultima.tatico}        cor="bg-purple-500" />
                  <ScoreBar label="Comportamento"  val={ultima.comportamento} cor="bg-orange-500" />
                </div>
              </div>
            )}

            {!ultima && (
              <div className="py-10 text-center text-gray-400 text-sm">
                Nenhuma avaliação registrada ainda.
              </div>
            )}
          </div>
        </div>

        {/* Assinatura digital */}
        <div className="bg-green-50 border border-green-100 rounded-2xl px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="text-green-600 text-lg flex-shrink-0">🔐</span>
            <div>
              <p className="text-sm font-semibold text-green-800">Dados verificados e autenticados</p>
              <p className="text-xs text-green-700 mt-0.5">
                Gerado via ScoutBase em {geradoEm}. Os dados de avaliação são registrados e
                não podem ser alterados retroativamente.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 pb-4">
          ScoutBase · Plataforma de gestão de escolinhas de futebol
        </p>

      </div>
    </div>
  )
}
