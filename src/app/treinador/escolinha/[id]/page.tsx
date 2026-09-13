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

const CATEGORIAS = ['Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20', 'Adulto']

type Escolinha = {
  id:   string
  nome: string
}

type Turma = {
  id:        string
  nome:      string
  categoria: string | null
}

export default function EscolinhaDashboardPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const escolinhaId = params.id

  const [loading,     setLoading]     = useState(true)
  const [escolinha,   setEscolinha]   = useState<Escolinha | null>(null)
  const [turmas,      setTurmas]      = useState<Turma[]>([])
  const [atletaCount, setAtletaCount] = useState(0)
  const [atletasPorTurma, setAtletasPorTurma] = useState<Record<string, number>>({})

  const [modalAberto,  setModalAberto]  = useState(false)
  const [novoNome,      setNovoNome]      = useState('')
  const [novaCategoria, setNovaCategoria] = useState(CATEGORIAS[0])
  const [criando,       setCriando]       = useState(false)
  const [erroModal,     setErroModal]     = useState<string | null>(null)

  async function carregarTurmas(uid: string) {
    const supabase = createClient()

    const { data: turmasRows } = await supabase
      .from('turmas')
      .select('id, nome, categoria')
      .eq('escolinha_id', escolinhaId)
      .order('criado_em', { ascending: false })

    const turmasList = turmasRows ?? []
    setTurmas(turmasList)

    if (turmasList.length > 0) {
      const { data: atletaRows } = await supabase
        .from('turma_atletas')
        .select('turma_id, profile_id')
        .in('turma_id', turmasList.map(t => t.id))

      const rows = atletaRows ?? []
      setAtletaCount(new Set(rows.map(r => r.profile_id)).size)

      const porTurma: Record<string, number> = {}
      for (const r of rows) porTurma[r.turma_id] = (porTurma[r.turma_id] ?? 0) + 1
      setAtletasPorTurma(porTurma)
    } else {
      setAtletaCount(0)
      setAtletasPorTurma({})
    }

    return uid
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

        const { data: escolinhaRow } = await supabase
          .from('escolinhas')
          .select('id, nome')
          .eq('id', escolinhaId)
          .single()

        if (!escolinhaRow) { router.push('/treinador/dashboard'); return }
        if (cancelled) return
        setEscolinha(escolinhaRow)

        if (!cancelled) await carregarTurmas(user.id)

      } finally {
        if (!cancelled) setLoading(false)
        clearTimeout(safetyTimeout)
      }
    }

    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escolinhaId, router])

  async function handleCriarTurma(e: React.FormEvent) {
    e.preventDefault()
    if (!novoNome.trim()) { setErroModal('Informe o nome da turma.'); return }
    setErroModal(null)
    setCriando(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { error } = await supabase.from('turmas').insert({
        nome:          novoNome.trim(),
        categoria:     novaCategoria,
        professor_id:  user.id,
        escolinha_id:  escolinhaId,
      })

      if (error) { setErroModal('Não foi possível criar a turma. Tente novamente.'); setCriando(false); return }

      await carregarTurmas(user.id)
      setModalAberto(false)
      setNovoNome('')
      setNovaCategoria(CATEGORIAS[0])
    } finally {
      setCriando(false)
    }
  }

  if (loading) {
    return (
      <main style={{ background: BG, minHeight: '100dvh', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`.skel{background:linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.07) 50%,rgba(255,255,255,0.03) 75%);background-size:200% 100%;animation:skelShimmer 1.4s infinite}@keyframes skelShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        <div style={{ width: '100%', maxWidth: '420px', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="skel" style={{ width: '60%', height: '32px', borderRadius: '10px' }} />
          <div className="skel" style={{ width: '100%', height: '90px', borderRadius: '16px' }} />
          <div className="skel" style={{ width: '100%', height: '160px', borderRadius: '16px' }} />
        </div>
      </main>
    )
  }

  if (!escolinha) return null

  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: '10px', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`,
    color: TEXT, fontSize: '15px', outline: 'none', fontFamily: 'system-ui, sans-serif',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: 700,
    color: DIM, marginBottom: '6px',
    letterSpacing: '0.04em', textTransform: 'uppercase',
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
        .a2 { animation:fadeUp .5s ease forwards .1s;  opacity:0 }
        .a3 { animation:fadeUp .5s ease forwards .2s;  opacity:0 }

        .stat-tile {
          background: ${CARD}; border: 1px solid ${BORDER}; border-radius: 14px;
          padding: 16px 8px; text-align: center;
        }
        .turma-card {
          background: ${CARD}; border: 1px solid ${BORDER}; border-radius: 14px;
          padding: 16px 18px; display: flex; align-items: center; justify-content: space-between;
          text-decoration: none; transition: border-color .15s;
        }
        .turma-card:hover { border-color: ${GREEN}55; }
        .nova-turma-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 16px; border-radius: 10px; border: 1px solid ${GREEN}55;
          background: ${GREEN}14; color: ${GREEN}; font-weight: 800; font-size: 13px;
          cursor: pointer; font-family: system-ui, sans-serif;
        }
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
          <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: GREEN, textTransform: 'uppercase' }}>
            Escolinha
          </p>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 900, color: TEXT, letterSpacing: '-0.02em' }}>
            {escolinha.nome}
          </h1>
        </div>

        {/* Stats row */}
        <div className="a2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '32px' }}>
          <div className="stat-tile">
            <div style={{ fontSize: '24px', fontWeight: 900, color: turmas.length > 0 ? GREEN : DIM, letterSpacing: '-0.03em' }}>
              {turmas.length}
            </div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '4px' }}>
              Turmas
            </div>
          </div>
          <div className="stat-tile">
            <div style={{ fontSize: '24px', fontWeight: 900, color: atletaCount > 0 ? GREEN : DIM, letterSpacing: '-0.03em' }}>
              {atletaCount}
            </div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '4px' }}>
              Atletas
            </div>
          </div>
          <div className="stat-tile">
            <div style={{ fontSize: '24px', fontWeight: 900, color: DIM, letterSpacing: '-0.03em' }}>
              —
            </div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '4px' }}>
              Presença média
            </div>
          </div>
        </div>

        {/* Turmas section */}
        <div className="a3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <p style={{ margin: 0, fontSize: '9px', fontWeight: 800, letterSpacing: '0.16em', color: DIM, textTransform: 'uppercase' }}>
              Turmas
            </p>
            <button type="button" className="nova-turma-btn" onClick={() => setModalAberto(true)}>
              + Nova turma
            </button>
          </div>

          {turmas.length === 0 ? (
            <div style={{
              padding: '32px 20px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: '16px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🏟️</div>
              <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: TEXT }}>
                Nenhuma turma ainda
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: DIM, lineHeight: 1.6 }}>
                Crie sua primeira turma para começar a organizar seus atletas.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {turmas.map(t => (
                <Link key={t.id} href={`/treinador/escolinha/${escolinhaId}/turma/${t.id}`} className="turma-card">
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 700, color: TEXT }}>{t.nome}</p>
                    {t.categoria && (
                      <p style={{ margin: 0, fontSize: '11px', color: DIM }}>{t.categoria}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: (atletasPorTurma[t.id] ?? 0) > 0 ? GREEN : DIM }}>
                      {atletasPorTurma[t.id] ?? 0} atleta{(atletasPorTurma[t.id] ?? 0) === 1 ? '' : 's'}
                    </span>
                    <span style={{ color: DIM, fontSize: '16px' }}>›</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>

      {modalAberto && (
        <div className="modal-overlay" onClick={() => !criando && setModalAberto(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: GREEN, textTransform: 'uppercase' }}>
              Nova turma
            </p>
            <h2 style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: 900, color: TEXT }}>
              Criar turma
            </h2>

            <form onSubmit={handleCriarTurma} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Nome da turma</label>
                <input
                  type="text" required autoFocus value={novoNome} onChange={e => setNovoNome(e.target.value)}
                  placeholder="Ex: Sub-11 Manhã" style={fieldStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Categoria</label>
                <select value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)} style={{ ...fieldStyle, cursor: 'pointer' }}>
                  {CATEGORIAS.map(c => <option key={c} value={c} style={{ background: BG }}>{c}</option>)}
                </select>
              </div>

              {erroModal && (
                <p style={{ margin: 0, padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '13px', color: '#f87171' }}>
                  {erroModal}
                </p>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button" onClick={() => setModalAberto(false)} disabled={criando}
                  style={{
                    flex: 1, padding: '14px', borderRadius: '12px', border: `1px solid ${BORDER}`,
                    background: 'transparent', color: DIM, fontSize: '14px', fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit" disabled={criando}
                  style={{
                    flex: 2, padding: '14px', borderRadius: '12px', border: 'none',
                    background: GREEN, color: '#03150a', fontSize: '14px', fontWeight: 800,
                    cursor: criando ? 'not-allowed' : 'pointer', opacity: criando ? 0.6 : 1,
                    fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  {criando ? 'Criando…' : 'Criar turma'}
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
