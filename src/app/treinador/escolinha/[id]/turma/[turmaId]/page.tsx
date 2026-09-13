'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import TreinadorBottomNav from '@/components/TreinadorBottomNav'

const BG     = '#0a1410'
const CARD   = '#0f1d17'
const BORDER = '#1c2b24'
const GREEN  = '#00ff44'
const TEXT   = '#eef4f0'
const DIM    = '#8a9b91'

type Turma = {
  id:        string
  nome:      string
  categoria: string | null
}

type Atleta = {
  vinculoId:  string
  profileId:  string
  nome:       string
  posicao:    string
  avatar_url: string | null
}

type BuscaResultado = {
  profileId:  string
  athlete_id: string
  nome:       string
  posicao:    string
  avatar_url: string | null
}

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

export default function TurmaDetalhePage() {
  const params = useParams<{ id: string; turmaId: string }>()
  const router = useRouter()
  const escolinhaId = params.id
  const turmaId = params.turmaId

  const [loading, setLoading] = useState(true)
  const [turma,   setTurma]   = useState<Turma | null>(null)
  const [atletas, setAtletas] = useState<Atleta[]>([])

  const [modalAberto, setModalAberto] = useState(false)
  const [atletaIdBusca, setAtletaIdBusca] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [resultado, setResultado] = useState<BuscaResultado | null>(null)
  const [erroModal, setErroModal] = useState<string | null>(null)
  const [adicionando, setAdicionando] = useState(false)
  const [removendo, setRemovendo] = useState<string | null>(null)

  async function carregarAtletas() {
    const supabase = createClient()
    const { data: vinculos } = await supabase
      .from('turma_atletas')
      .select('id, profile_id')
      .eq('turma_id', turmaId)

    const rows = vinculos ?? []
    if (rows.length === 0) { setAtletas([]); return }

    const res = await fetch('/api/atleta/nomes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: rows.map(r => r.profile_id) }),
    })
    const nomes: { id: string; nome: string; posicao: string; avatar_url: string | null }[] =
      res.ok ? await res.json() : []
    const nomeMap = new Map(nomes.map(n => [n.id, n]))

    setAtletas(rows.map(r => {
      const info = nomeMap.get(r.profile_id)
      return {
        vinculoId:  r.id,
        profileId:  r.profile_id,
        nome:       info?.nome ?? 'Atleta',
        posicao:    info?.posicao ?? '',
        avatar_url: info?.avatar_url ?? null,
      }
    }))
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      const safetyTimeout = setTimeout(() => { if (!cancelled) { setLoading(false); router.push('/login') } }, 4000)
      try {
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
          .select('id, nome, categoria')
          .eq('id', turmaId)
          .eq('escolinha_id', escolinhaId)
          .single()

        if (!turmaRow) { router.push(`/treinador/escolinha/${escolinhaId}`); return }
        if (cancelled) return
        setTurma(turmaRow)

        if (!cancelled) await carregarAtletas()

      } finally {
        if (!cancelled) setLoading(false)
        clearTimeout(safetyTimeout)
      }
    }

    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escolinhaId, turmaId, router])

  async function handleBuscar(e: React.FormEvent) {
    e.preventDefault()
    if (!atletaIdBusca.trim()) return
    setErroModal(null)
    setResultado(null)
    setBuscando(true)
    try {
      const res = await fetch('/api/treinador/buscar-atleta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ atletaId: atletaIdBusca.trim() }),
      })
      const data = await res.json() as BuscaResultado & { error?: string }
      if (!res.ok || data.error) { setErroModal(data.error ?? 'Atleta não encontrado.'); return }
      if (atletas.some(a => a.profileId === data.profileId)) { setErroModal('Esse atleta já está nessa turma.'); return }
      setResultado(data)
    } finally {
      setBuscando(false)
    }
  }

  async function handleAdicionar() {
    if (!resultado) return
    setAdicionando(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('turma_atletas').insert({
        turma_id: turmaId,
        profile_id: resultado.profileId,
      })
      if (error) { setErroModal('Não foi possível adicionar o atleta. Tente novamente.'); return }

      await carregarAtletas()
      setModalAberto(false)
      setAtletaIdBusca('')
      setResultado(null)
    } finally {
      setAdicionando(false)
    }
  }

  async function handleRemover(vinculoId: string) {
    if (!confirm('Remover este atleta da turma?')) return
    setRemovendo(vinculoId)
    const supabase = createClient()
    await supabase.from('turma_atletas').delete().eq('id', vinculoId)
    setAtletas(prev => prev.filter(a => a.vinculoId !== vinculoId))
    setRemovendo(null)
  }

  function fecharModal() {
    setModalAberto(false)
    setAtletaIdBusca('')
    setResultado(null)
    setErroModal(null)
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

  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: '10px', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`,
    color: TEXT, fontSize: '15px', outline: 'none', fontFamily: 'system-ui, sans-serif',
  }

  return (
    <main style={{
      background: BG,
      minHeight: '100dvh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '0 0 calc(80px + env(safe-area-inset-bottom))',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .a1 { animation:fadeUp .5s ease forwards 0s;   opacity:0 }
        .a2 { animation:fadeUp .5s ease forwards .15s; opacity:0 }

        .atleta-card {
          background: ${CARD}; border: 1px solid ${BORDER}; border-radius: 14px;
          padding: 12px 14px; display: flex; align-items: center; gap: 12px;
        }
        .add-atleta-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 16px; border-radius: 10px; border: 1px solid ${GREEN}55;
          background: ${GREEN}14; color: ${GREEN}; font-weight: 800; font-size: 13px;
          cursor: pointer; font-family: system-ui, sans-serif;
        }
        .remove-btn {
          background: none; border: none; cursor: pointer; color: ${DIM}; font-size: 18px;
          padding: 4px 8px; flex-shrink: 0;
        }
        .remove-btn:hover { color: #f87171; }
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 200;
          display: flex; align-items: flex-end; justify-content: center;
        }
        .modal-sheet {
          width: 100%; max-width: 420px; background: ${BG}; border-top: 1px solid ${BORDER};
          border-radius: 20px 20px 0 0; padding: 24px 20px calc(24px + env(safe-area-inset-bottom));
        }
      `}</style>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px', padding: '0 20px' }}>

        {/* Header */}
        <div className="a1" style={{
          paddingTop: 'calc(26px + env(safe-area-inset-top))', paddingBottom: '24px',
        }}>
          <Link href={`/treinador/escolinha/${escolinhaId}`} style={{
            display: 'inline-block', marginBottom: '16px', fontSize: '13px', color: DIM, textDecoration: 'none',
          }}>
            ← Voltar
          </Link>
          <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: GREEN, textTransform: 'uppercase' }}>
            Turma
          </p>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 900, color: TEXT, letterSpacing: '-0.02em' }}>
            {turma.nome}
          </h1>
          {turma.categoria && (
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: DIM }}>{turma.categoria}</p>
          )}
        </div>

        {/* Chamada */}
        <div className="a1" style={{ marginBottom: '20px' }}>
          <Link href={`/treinador/escolinha/${escolinhaId}/turma/${turmaId}/presenca`} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '14px', borderRadius: '14px', textDecoration: 'none',
            background: `${GREEN}14`, border: `1px solid ${GREEN}55`,
            fontSize: '14px', fontWeight: 800, color: GREEN,
          }}>
            📋 Fazer chamada
          </Link>
        </div>

        {/* Atletas section */}
        <div className="a2">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <p style={{ margin: 0, fontSize: '9px', fontWeight: 800, letterSpacing: '0.16em', color: DIM, textTransform: 'uppercase' }}>
              Atletas ({atletas.length})
            </p>
            <button type="button" className="add-atleta-btn" onClick={() => setModalAberto(true)}>
              + Adicionar atleta
            </button>
          </div>

          {atletas.length === 0 ? (
            <div style={{
              padding: '32px 20px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: '16px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>👤</div>
              <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: TEXT }}>
                Nenhum atleta ainda
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: DIM, lineHeight: 1.6 }}>
                Adicione atletas pelo ID Meu Craque deles (ex: MC-12345).
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {atletas.map(a => (
                <div key={a.vinculoId} className="atleta-card">
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0,
                    background: a.avatar_url ? 'transparent' : 'linear-gradient(145deg,#166534,#22c55e)',
                    overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {a.avatar_url
                      ? <img src={a.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: '13px', fontWeight: 900, color: 'white' }}>{getInitials(a.nome)}</span>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 700, color: TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {a.nome}
                    </p>
                    {a.posicao && (
                      <p style={{ margin: 0, fontSize: '11px', color: DIM, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{a.posicao}</p>
                    )}
                  </div>
                  <button
                    type="button" className="remove-btn"
                    disabled={removendo === a.vinculoId}
                    onClick={() => handleRemover(a.vinculoId)}
                    title="Remover da turma"
                  >
                    {removendo === a.vinculoId ? '…' : '✕'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {modalAberto && (
        <div className="modal-overlay" onClick={() => fecharModal()}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: GREEN, textTransform: 'uppercase' }}>
              Adicionar atleta
            </p>
            <h2 style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: 900, color: TEXT }}>
              Buscar por ID
            </h2>

            <form onSubmit={handleBuscar} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text" autoFocus value={atletaIdBusca}
                  onChange={e => { setAtletaIdBusca(e.target.value); setResultado(null) }}
                  placeholder="Ex: MC-12345" style={{ ...fieldStyle, flex: 1 }}
                />
                <button
                  type="submit" disabled={buscando || !atletaIdBusca.trim()}
                  style={{
                    padding: '0 18px', borderRadius: '10px', border: 'none',
                    background: GREEN, color: '#03150a', fontWeight: 800, fontSize: '14px',
                    cursor: 'pointer', opacity: buscando ? 0.6 : 1, fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  {buscando ? '...' : 'Buscar'}
                </button>
              </div>

              {erroModal && (
                <p style={{ margin: 0, padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '13px', color: '#f87171' }}>
                  {erroModal}
                </p>
              )}

              {resultado && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 14px', background: CARD, border: `1px solid ${GREEN}40`, borderRadius: '12px',
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                    background: resultado.avatar_url ? 'transparent' : 'linear-gradient(145deg,#166534,#22c55e)',
                    overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {resultado.avatar_url
                      ? <img src={resultado.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: '12px', fontWeight: 900, color: 'white' }}>{getInitials(resultado.nome)}</span>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 700, color: TEXT }}>{resultado.nome}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: DIM }}>{resultado.athlete_id}{resultado.posicao ? ` · ${resultado.posicao}` : ''}</p>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button" onClick={fecharModal}
                  style={{
                    flex: 1, padding: '14px', borderRadius: '12px', border: `1px solid ${BORDER}`,
                    background: 'transparent', color: DIM, fontSize: '14px', fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button" onClick={handleAdicionar} disabled={!resultado || adicionando}
                  style={{
                    flex: 2, padding: '14px', borderRadius: '12px', border: 'none',
                    background: GREEN, color: '#03150a', fontSize: '14px', fontWeight: 800,
                    cursor: (!resultado || adicionando) ? 'not-allowed' : 'pointer',
                    opacity: (!resultado || adicionando) ? 0.5 : 1,
                    fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  {adicionando ? 'Adicionando…' : 'Adicionar à turma'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <TreinadorBottomNav />
    </main>
  )
}
