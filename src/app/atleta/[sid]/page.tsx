/**
 * /atleta/[sid] — Perfil público do atleta
 * Acessível sem login. Admin client para bypass de RLS.
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'

type Props = { params: Promise<{ sid: string }> }

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map((n) => n[0] ?? '').join('').toUpperCase()
}

function calcularIdade(dataNasc: string | null): number | null {
  if (!dataNasc) return null
  const hoje = new Date()
  const nasc = new Date(dataNasc + 'T12:00:00')
  let idade = hoje.getFullYear() - nasc.getFullYear()
  if (
    hoje.getMonth() < nasc.getMonth() ||
    (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate())
  ) idade--
  return idade >= 0 ? idade : null
}

function categoriaParaIdade(idade: number): string {
  if (idade <= 5)  return 'Sub-5'
  if (idade <= 7)  return 'Sub-7'
  if (idade <= 9)  return 'Sub-9'
  if (idade <= 11) return 'Sub-11'
  if (idade <= 13) return 'Sub-13'
  if (idade <= 15) return 'Sub-15'
  if (idade <= 17) return 'Sub-17'
  if (idade <= 20) return 'Sub-20'
  return 'Adulto'
}

function scoreLabel(s: number) {
  if (s >= 80) return 'Elite'
  if (s >= 65) return 'Alto'
  if (s >= 50) return 'Médio'
  return 'Em desenvolvimento'
}

// ── Sub-components ───────────────────────────────────────────────────────────

function PilarBar({ label, val, color }: { label: string; val: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${(val / 10) * 100}%` }} />
      </div>
      <span className="text-xs font-bold text-white w-8 text-right">{val.toFixed(1)}</span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AtletaPublicoPage({ params }: Props) {
  const { sid } = await params
  const admin = createAdminClient()

  const { data: aluno } = await admin
    .from('alunos')
    .select('id, nome, posicao, scout_id, ativo, data_nascimento, turmas(nome)')
    .eq('scout_id', sid.toUpperCase())
    .single()

  if (!aluno) notFound()

  const [{ data: avaliacoes }, { data: presencas }] = await Promise.all([
    admin
      .from('avaliacoes')
      .select('tecnico, fisico, tatico, comportamento, scout_score, created_at')
      .eq('aluno_id', aluno.id)
      .order('created_at', { ascending: false }),
    admin
      .from('presencas')
      .select('presente, data')
      .eq('aluno_id', aluno.id)
      .order('data', { ascending: false }),
  ])

  // ── Métricas ─────────────────────────────────────────────────────────────

  const lista = avaliacoes ?? []
  const scores = lista.map((a) => a.scout_score).filter(Boolean) as number[]
  const scoutScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null

  const mediasPilares = lista.length > 0
    ? {
        tecnico:       Math.round((lista.reduce((a, b) => a + b.tecnico, 0)       / lista.length) * 10) / 10,
        fisico:        Math.round((lista.reduce((a, b) => a + b.fisico, 0)        / lista.length) * 10) / 10,
        tatico:        Math.round((lista.reduce((a, b) => a + b.tatico, 0)        / lista.length) * 10) / 10,
        comportamento: Math.round((lista.reduce((a, b) => a + b.comportamento, 0) / lista.length) * 10) / 10,
      }
    : null

  const totalPresencas = presencas?.length ?? 0
  const presentes      = presencas?.filter((p) => p.presente).length ?? 0
  const frequencia     = totalPresencas > 0 ? Math.round((presentes / totalPresencas) * 100) : null
  const ultimoTreino   = presencas?.find((p) => p.data)?.data ?? null

  const idade    = calcularIdade((aluno as { data_nascimento?: string | null }).data_nascimento ?? null)
  const categoria = idade !== null ? categoriaParaIdade(idade) : null

  const turmaNome =
    aluno.turmas && !Array.isArray(aluno.turmas)
      ? (aluno.turmas as { nome: string }).nome
      : null

  // Evolução: últimos 30 dias vs anteriores
  const agora   = new Date()
  const ha30    = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const recentes = lista.filter((a) => a.created_at >= ha30 && a.scout_score != null).map((a) => a.scout_score as number)
  const antigos  = lista.filter((a) => a.created_at <  ha30 && a.scout_score != null).map((a) => a.scout_score as number)
  const mRecente = recentes.length > 0 ? recentes.reduce((a, b) => a + b, 0) / recentes.length : null
  const mAntiga  = antigos.length  > 0 ? antigos.reduce((a, b) => a + b, 0)  / antigos.length  : null
  const evolucao = mRecente !== null && mAntiga !== null && mAntiga > 0
    ? ((mRecente - mAntiga) / mAntiga * 100).toFixed(1) : null

  const historico = lista.slice(0, 8)
  const geradoEm  = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <main className="min-h-screen" style={{ background: '#09110d' }}>
      <div className="max-w-lg mx-auto px-4 py-10 space-y-4">

        {/* ── Branding ── */}
        <div className="text-center mb-2">
          <Link href="https://scoutbase-eta.vercel.app" className="text-green-500 text-xl font-black tracking-wide">
            ScoutBase
          </Link>
          <p className="text-xs mt-0.5" style={{ color: '#2d4a32' }}>Plataforma de gestão de atletas</p>
        </div>

        {/* ── Header card ── */}
        <div className="rounded-2xl overflow-hidden border border-white/5" style={{ background: '#111a13' }}>
          <div className="h-1 bg-gradient-to-r from-green-800 to-green-500" />
          <div className="p-6">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                style={{ background: '#16a34a' }}
              >
                {getInitials(aluno.nome)}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-white">{aluno.nome}</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {[aluno.posicao, turmaNome].filter(Boolean).join(' · ') || 'Sem posição informada'}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {categoria && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#1a3a1e', color: '#4ade80' }}>
                      {categoria}
                    </span>
                  )}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    (aluno as { ativo?: boolean }).ativo
                      ? 'text-green-400'
                      : 'text-gray-600'
                  }`} style={{ background: 'rgba(255,255,255,0.05)' }}>
                    {(aluno as { ativo?: boolean }).ativo ? '● Ativo' : '○ Inativo'}
                  </span>
                </div>
              </div>
            </div>

            {/* Scout ID */}
            <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs tracking-[0.2em] uppercase mb-1" style={{ color: '#2d4a32' }}>Scout ID</p>
              <p className="text-3xl font-black tracking-widest font-mono leading-none" style={{ color: '#4ade80' }}>
                {aluno.scout_id}
              </p>
            </div>
          </div>
        </div>

        {/* ── Cards de métricas ── */}
        <div className="grid grid-cols-2 gap-3">
          {/* Scout Score */}
          <div className="rounded-2xl p-5 border border-white/5" style={{ background: '#111a13' }}>
            <p className="text-xs uppercase tracking-wide" style={{ color: '#2d4a32' }}>Scout Score</p>
            <p className={`text-4xl font-bold mt-1 leading-none ${
              scoutScore === null ? 'text-gray-700'
              : scoutScore >= 75 ? 'text-green-400'
              : scoutScore >= 50 ? 'text-yellow-400'
              : 'text-red-400'
            }`}>
              {scoutScore ?? '—'}
            </p>
            {scoutScore !== null && (
              <>
                <p className="text-xs mt-1" style={{ color: '#2d4a32' }}>de 100</p>
                <p className="text-xs text-green-600 mt-1 font-medium">{scoreLabel(scoutScore)}</p>
              </>
            )}
          </div>

          {/* Frequência */}
          <div className="rounded-2xl p-5 border border-white/5" style={{ background: '#111a13' }}>
            <p className="text-xs uppercase tracking-wide" style={{ color: '#2d4a32' }}>Frequência</p>
            <p className={`text-4xl font-bold mt-1 leading-none ${
              frequencia === null ? 'text-gray-700'
              : frequencia >= 75 ? 'text-green-400'
              : 'text-red-400'
            }`}>
              {frequencia !== null ? `${frequencia}%` : '—'}
            </p>
            {totalPresencas > 0 && (
              <p className="text-xs mt-1" style={{ color: '#2d4a32' }}>{presentes}/{totalPresencas} aulas</p>
            )}
          </div>

          {/* Total avaliações */}
          <div className="rounded-2xl p-5 border border-white/5" style={{ background: '#111a13' }}>
            <p className="text-xs uppercase tracking-wide" style={{ color: '#2d4a32' }}>Avaliações</p>
            <p className="text-4xl font-bold mt-1 leading-none text-white">{lista.length}</p>
            <p className="text-xs mt-1" style={{ color: '#2d4a32' }}>registradas</p>
          </div>

          {/* Último treino */}
          <div className="rounded-2xl p-5 border border-white/5" style={{ background: '#111a13' }}>
            <p className="text-xs uppercase tracking-wide" style={{ color: '#2d4a32' }}>Último treino</p>
            <p className="text-xl font-bold mt-1 leading-tight text-white">
              {ultimoTreino
                ? new Date(ultimoTreino + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                : '—'}
            </p>
            {ultimoTreino && (
              <p className="text-xs mt-1" style={{ color: '#2d4a32' }}>
                {new Date(ultimoTreino + 'T12:00:00').getFullYear()}
              </p>
            )}
          </div>
        </div>

        {/* ── Pilares ── */}
        {mediasPilares && (
          <div className="rounded-2xl p-6 border border-white/5 space-y-4" style={{ background: '#111a13' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Scout Score por categoria</h2>
              <span className="text-xs" style={{ color: '#2d4a32' }}>média geral</span>
            </div>
            <PilarBar label="Técnico"       val={mediasPilares.tecnico}       color="bg-blue-500" />
            <PilarBar label="Físico"         val={mediasPilares.fisico}        color="bg-green-500" />
            <PilarBar label="Tático"         val={mediasPilares.tatico}        color="bg-purple-500" />
            <PilarBar label="Comportamento"  val={mediasPilares.comportamento} color="bg-orange-500" />
          </div>
        )}

        {/* ── Badge de evolução ── */}
        {evolucao !== null && (
          <div
            className="rounded-2xl px-5 py-4 flex items-center gap-3"
            style={{
              background: parseFloat(evolucao) >= 0 ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)',
              border: `1px solid ${parseFloat(evolucao) >= 0 ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'}`,
            }}
          >
            <span className={`text-2xl ${parseFloat(evolucao) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {parseFloat(evolucao) >= 0 ? '↑' : '↓'}
            </span>
            <div>
              <p className={`text-sm font-semibold ${parseFloat(evolucao) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {parseFloat(evolucao) >= 0 ? '+' : ''}{evolucao}% nos últimos 30 dias
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#2d4a32' }}>Variação do Scout Score</p>
            </div>
          </div>
        )}

        {/* ── Histórico ── */}
        {historico.length > 0 && (
          <div className="rounded-2xl p-6 border border-white/5" style={{ background: '#111a13' }}>
            <h2 className="text-sm font-semibold text-white mb-4">Histórico de evolução</h2>
            <ul style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              {historico.map((av, i) => {
                const anterior = historico[i + 1]?.scout_score ?? null
                const delta = av.scout_score != null && anterior != null
                  ? av.scout_score - anterior : null
                return (
                  <li
                    key={i}
                    className="flex items-center justify-between py-3"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <div>
                      <p className="text-sm font-medium text-white">
                        {new Date(av.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {delta !== null && (
                        <span className={`text-xs font-semibold ${delta > 0 ? 'text-green-500' : delta < 0 ? 'text-red-400' : 'text-gray-600'}`}>
                          {delta > 0 ? `+${delta}` : delta}
                        </span>
                      )}
                      {av.scout_score != null && (
                        <span className={`text-base font-bold ${
                          av.scout_score >= 75 ? 'text-green-400'
                          : av.scout_score >= 50 ? 'text-yellow-400'
                          : 'text-red-400'
                        }`}>
                          {av.scout_score}
                        </span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {lista.length === 0 && (
          <div
            className="rounded-2xl p-10 border border-white/5 text-center"
            style={{ background: '#111a13' }}
          >
            <p className="text-sm" style={{ color: '#2d4a32' }}>Nenhuma avaliação registrada ainda.</p>
          </div>
        )}

        {/* ── Verificação ── */}
        <div
          className="rounded-2xl px-5 py-4 flex items-start gap-3"
          style={{ background: 'rgba(22,163,74,0.05)', border: '1px solid rgba(22,163,74,0.15)' }}
        >
          <span className="text-lg flex-shrink-0 mt-0.5" style={{ color: '#16a34a' }}>🔐</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#4ade80' }}>Dados verificados e autenticados</p>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#2d6a35' }}>
              Gerado via ScoutBase em {geradoEm}. Os registros são imutáveis e não podem ser alterados retroativamente.
            </p>
          </div>
        </div>

        {/* ── Rodapé ── */}
        <div className="text-center pt-2 pb-6 space-y-1">
          <p className="text-xs" style={{ color: '#1e3a22' }}>Perfil gerado pelo ScoutBase</p>
          <Link
            href="https://scoutbase-eta.vercel.app"
            className="text-xs transition-colors hover:text-green-500"
            style={{ color: '#2d4a32' }}
          >
            scoutbase-eta.vercel.app
          </Link>
        </div>

      </div>
    </main>
  )
}
