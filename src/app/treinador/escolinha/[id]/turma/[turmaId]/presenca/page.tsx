'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import TreinadorBottomNav from '@/components/TreinadorBottomNav'

const BG     = '#0a1410'
const CARD   = '#0f1d17'
const BORDER = '#1c2b24'
const GREEN  = '#00ff44'
const RED    = '#f87171'
const TEXT   = '#eef4f0'
const DIM    = '#8a9b91'

type Turma  = { id: string; nome: string }
type Atleta = { profileId: string; nome: string; posicao: string; avatar_url: string | null }
type Status = 'presente' | 'falta'

const HOJE = new Date().toISOString().split('T')[0]

const dataFormatada = (() => {
  const s = new Date(HOJE + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
  return s.charAt(0).toUpperCase() + s.slice(1)
})()

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

export default function ChamadaPage() {
  const params = useParams<{ id: string; turmaId: string }>()
  const router = useRouter()
  const escolinhaId = params.id
  const turmaId = params.turmaId

  const [loading, setLoading] = useState(true)
  const [turma,   setTurma]   = useState<Turma | null>(null)
  const [atletas, setAtletas] = useState<Atleta[]>([])
  const [marcacoes, setMarcacoes] = useState<Record<string, Status>>({})
  const [salvando, setSalvando] = useState(false)
  const [salvoOk,  setSalvoOk]  = useState(false)

  const carregar = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: acesso } = await supabase
      .from('escolinha_treinadores')
      .select('status')
      .eq('escolinha_id', escolinhaId)
      .eq('profile_id', user.id)
      .eq('status', 'aceito')
      .maybeSingle()

    if (!acesso) { router.push('/treinador/dashboard'); return }

    const { data: turmaRow } = await supabase
      .from('turmas')
      .select('id, nome')
      .eq('id', turmaId)
      .eq('escolinha_id', escolinhaId)
      .single()

    if (!turmaRow) { router.push(`/treinador/escolinha/${escolinhaId}`); return }
    setTurma(turmaRow)

    const { data: vinculos } = await supabase
      .from('turma_atletas')
      .select('profile_id')
      .eq('turma_id', turmaId)

    const ids = (vinculos ?? []).map(v => v.profile_id)

    if (ids.length === 0) {
      setAtletas([])
      setMarcacoes({})
      return
    }

    const res = await fetch('/api/atleta/nomes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    const nomes: { id: string; nome: string; posicao: string; avatar_url: string | null }[] =
      res.ok ? await res.json() : []
    const nomeMap = new Map(nomes.map(n => [n.id, n]))

    const lista = ids.map(id => {
      const info = nomeMap.get(id)
      return {
        profileId:  id,
        nome:       info?.nome ?? 'Atleta',
        posicao:    info?.posicao ?? '',
        avatar_url: info?.avatar_url ?? null,
      }
    }).sort((a, b) => a.nome.localeCompare(b.nome))
    setAtletas(lista)

    const { data: dadosHoje } = await supabase
      .from('presencas_turma')
      .select('profile_id, status')
      .eq('turma_id', turmaId)
      .eq('data', HOJE)

    const mapa: Record<string, Status> = {}
    for (const p of dadosHoje ?? []) mapa[p.profile_id] = p.status as Status
    setMarcacoes(mapa)
  }, [escolinhaId, turmaId, router])

  useEffect(() => {
    let cancelled = false
    const safetyTimeout = setTimeout(() => { if (!cancelled) { setLoading(false); router.push('/login') } }, 4000)

    carregar().finally(() => {
      if (!cancelled) setLoading(false)
      clearTimeout(safetyTimeout)
    })

    return () => { cancelled = true; clearTimeout(safetyTimeout) }
  }, [carregar, router])

  const countPresente  = Object.values(marcacoes).filter(v => v === 'presente').length
  const countFalta     = Object.values(marcacoes).filter(v => v === 'falta').length
  const totalMarcados  = Object.keys(marcacoes).length
  const semRegistro    = atletas.length - totalMarcados
  const todosMarcados  = atletas.length > 0 && totalMarcados === atletas.length

  function marcar(profileId: string, status: Status) {
    setMarcacoes(prev => {
      if (prev[profileId] === status) {
        const next = { ...prev }
        delete next[profileId]
        return next
      }
      return { ...prev, [profileId]: status }
    })
    setSalvoOk(false)
  }

  function marcarTodos() {
    const todos: Record<string, Status> = {}
    for (const a of atletas) todos[a.profileId] = 'presente'
    setMarcacoes(todos)
    setSalvoOk(false)
  }

  function limpar() {
    setMarcacoes({})
    setSalvoOk(false)
  }

  async function salvarTudo() {
    if (!todosMarcados) return
    setSalvando(true)
    const supabase = createClient()

    const { data: existentes } = await supabase
      .from('presencas_turma')
      .select('id, profile_id')
      .eq('turma_id', turmaId)
      .eq('data', HOJE)

    const existMap: Record<string, string> = {}
    for (const r of existentes ?? []) existMap[r.profile_id] = r.id

    const updates: PromiseLike<unknown>[] = []
    for (const atleta of atletas) {
      const status = marcacoes[atleta.profileId]
      if (!status) continue

      if (existMap[atleta.profileId]) {
        updates.push(
          supabase.from('presencas_turma').update({ status }).eq('id', existMap[atleta.profileId])
        )
      } else {
        updates.push(
          supabase.from('presencas_turma').insert({ turma_id: turmaId, profile_id: atleta.profileId, data: HOJE, status })
        )
      }
    }

    await Promise.all(updates)
    setSalvando(false)
    setSalvoOk(true)
    setTimeout(() => setSalvoOk(false), 3000)
  }

  if (loading) {
    return (
      <main style={{ background: BG, minHeight: '100dvh', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`.skel{background:linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.07) 50%,rgba(255,255,255,0.03) 75%);background-size:200% 100%;animation:skelShimmer 1.4s infinite}@keyframes skelShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        <div style={{ width: '100%', maxWidth: '420px', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="skel" style={{ width: '60%', height: '32px', borderRadius: '10px' }} />
          <div className="skel" style={{ width: '100%', height: '90px', borderRadius: '16px' }} />
        </div>
      </main>
    )
  }

  if (!turma) return null

  return (
    <main style={{
      background: BG,
      minHeight: '100dvh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '0 0 calc(180px + env(safe-area-inset-bottom))',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .a1 { animation:fadeUp .5s ease forwards 0s;   opacity:0 }
        .a2 { animation:fadeUp .5s ease forwards .1s;  opacity:0 }
        .a3 { animation:fadeUp .5s ease forwards .2s;  opacity:0 }

        .stat-tile { background: ${CARD}; border: 1px solid ${BORDER}; border-radius: 14px; padding: 14px 8px; text-align: center; }
        .atleta-row { background: ${CARD}; border: 1px solid ${BORDER}; border-radius: 14px; padding: 12px 14px; }
        .status-btn {
          flex: 1; padding: 12px; border-radius: 10px; font-size: 13px; font-weight: 800;
          cursor: pointer; font-family: system-ui, sans-serif; transition: all .15s; border: 1px solid transparent;
        }
        .quick-btn {
          flex: 1; padding: 13px; border-radius: 12px; font-size: 13px; font-weight: 800;
          cursor: pointer; font-family: system-ui, sans-serif; border: 1px solid ${BORDER};
          background: transparent; color: ${DIM};
        }
        .quick-btn.primary { background: ${GREEN}; color: #03150a; border: none; }
        .save-bar {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 150;
          background: rgba(10,20,16,0.96); backdrop-filter: blur(20px);
          border-top: 1px solid ${BORDER};
          padding: 14px 20px calc(14px + env(safe-area-inset-bottom) + 64px);
        }
      `}</style>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px', padding: '0 20px' }}>

        {/* Header */}
        <div className="a1" style={{
          paddingTop: 'calc(26px + env(safe-area-inset-top))', paddingBottom: '20px',
        }}>
          <Link href={`/treinador/escolinha/${escolinhaId}/turma/${turmaId}`} style={{
            display: 'inline-block', marginBottom: '16px', fontSize: '13px', color: DIM, textDecoration: 'none',
          }}>
            ← Voltar
          </Link>
          <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: GREEN, textTransform: 'uppercase' }}>
            Chamada · {turma.nome}
          </p>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: TEXT, letterSpacing: '-0.02em' }}>
            {dataFormatada}
          </h1>
        </div>

        {atletas.length === 0 ? (
          <div style={{
            padding: '32px 20px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: '16px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>👤</div>
            <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: TEXT }}>
              Nenhum atleta nesta turma
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: DIM, lineHeight: 1.6 }}>
              Adicione atletas à turma antes de fazer a chamada.
            </p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="a2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div className="stat-tile">
                <div style={{ fontSize: '22px', fontWeight: 900, color: GREEN }}>{countPresente}</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '4px' }}>Presentes</div>
              </div>
              <div className="stat-tile">
                <div style={{ fontSize: '22px', fontWeight: 900, color: RED }}>{countFalta}</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '4px' }}>Faltas</div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="a2" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button type="button" className="quick-btn primary" onClick={marcarTodos}>
                ✅ Todos presentes
              </button>
              <button type="button" className="quick-btn" onClick={limpar}>
                Limpar
              </button>
            </div>

            {/* Lista */}
            <div className="a3" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {atletas.map(a => {
                const status = marcacoes[a.profileId] ?? null
                return (
                  <div key={a.profileId} className="atleta-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                        background: a.avatar_url ? 'transparent' : 'linear-gradient(145deg,#166534,#22c55e)',
                        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {a.avatar_url
                          ? <img src={a.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: '12px', fontWeight: 900, color: 'white' }}>{getInitials(a.nome)}</span>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: '0 0 1px', fontSize: '14px', fontWeight: 700, color: TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {a.nome}
                        </p>
                        {a.posicao && (
                          <p style={{ margin: 0, fontSize: '10px', color: DIM, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{a.posicao}</p>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button" onClick={() => marcar(a.profileId, 'presente')}
                        className="status-btn"
                        style={status === 'presente'
                          ? { background: GREEN, color: '#03150a' }
                          : { background: 'rgba(255,255,255,0.03)', color: DIM, borderColor: BORDER }
                        }
                      >
                        ✅ Presente
                      </button>
                      <button
                        type="button" onClick={() => marcar(a.profileId, 'falta')}
                        className="status-btn"
                        style={status === 'falta'
                          ? { background: 'rgba(248,113,113,0.16)', color: RED, borderColor: `${RED}55` }
                          : { background: 'rgba(255,255,255,0.03)', color: DIM, borderColor: BORDER }
                        }
                      >
                        ❌ Faltou
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {atletas.length > 0 && (
        <div className="save-bar">
          <div style={{ maxWidth: '420px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {semRegistro > 0 && (
              <p style={{ margin: 0, textAlign: 'center', fontSize: '12px', color: '#fbbf24' }}>
                ⚠️ {semRegistro} atleta{semRegistro !== 1 ? 's' : ''} sem registro ainda
              </p>
            )}
            {salvoOk ? (
              <div style={{
                padding: '14px', borderRadius: '14px', textAlign: 'center',
                background: `${GREEN}14`, border: `1px solid ${GREEN}55`, color: GREEN, fontSize: '14px', fontWeight: 800,
              }}>
                ✅ Presença salva com sucesso!
              </div>
            ) : (
              <button
                type="button" onClick={salvarTudo} disabled={!todosMarcados || salvando}
                style={{
                  padding: '14px', borderRadius: '14px', border: 'none', fontSize: '14px', fontWeight: 800,
                  fontFamily: 'system-ui, sans-serif',
                  background: todosMarcados ? GREEN : BORDER,
                  color: todosMarcados ? '#03150a' : DIM,
                  cursor: (!todosMarcados || salvando) ? 'not-allowed' : 'pointer',
                  opacity: salvando ? 0.7 : 1,
                }}
              >
                {salvando ? 'Salvando…' : `Salvar presença — ${totalMarcados}/${atletas.length} registrados`}
              </button>
            )}
          </div>
        </div>
      )}

      <TreinadorBottomNav />
    </main>
  )
}
