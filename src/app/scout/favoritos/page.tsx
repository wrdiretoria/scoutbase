'use client'

/**
 * /scout/favoritos — Atletas salvos.
 * Sem login — IDs lidos do localStorage ("mc_favoritos").
 * Dados buscados via /api/atleta/nomes.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'

const LS_KEY = 'mc_favoritos'

type AtletaInfo = {
  id:         string
  nome:       string
  posicao:    string
  avatar_url: string | null
}

function getFavoritos(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as string[] }
  catch { return [] }
}

function removeFavorito(atletaId: string) {
  const ids = getFavoritos().filter(id => id !== atletaId)
  localStorage.setItem(LS_KEY, JSON.stringify(ids))
}

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

function posAbrev(pos: string): string {
  const map: Record<string, string> = {
    'Goleiro': 'GK', 'Lateral Direito': 'LD', 'Lateral Esquerdo': 'LE',
    'Zagueiro': 'ZG', 'Volante': 'VOL', 'Meia': 'MEI',
    'Meia-Atacante': 'MAT', 'Ponta Direita': 'PD', 'Ponta Esquerda': 'PE',
    'Atacante': 'ATA', 'Centro-Avante': 'CA',
  }
  return map[pos] ?? pos.slice(0, 3).toUpperCase()
}

export default function ScoutFavoritosPage() {
  const [atletas,  setAtletas]  = useState<AtletaInfo[]>([])
  const [loading,  setLoading]  = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const ids = getFavoritos()
      if (ids.length === 0) { setLoading(false); return }
      try {
        const res = await fetch('/api/atleta/nomes', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ ids }),
        })
        if (res.ok) {
          const data = await res.json() as AtletaInfo[]
          // Preserva a ordem dos favoritos
          const ordered = ids
            .map(id => data.find(a => a.id === id))
            .filter((a): a is AtletaInfo => !!a)
          setAtletas(ordered)
        }
      } catch { /* silencia */ }
      setLoading(false)
    }
    load()
  }, [])

  function handleRemover(atletaId: string) {
    setRemoving(atletaId)
    removeFavorito(atletaId)
    setAtletas(prev => prev.filter(a => a.id !== atletaId))
    setRemoving(null)
  }

  return (
    <main style={{ background: '#06100a', minHeight: '100dvh', fontFamily: 'system-ui, sans-serif', color: 'white' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fav-card { animation: fadeUp .35s ease forwards; transition: background .2s, border-color .2s; }
        .fav-card:hover { border-color: rgba(251,191,36,0.25) !important; background: rgba(255,255,255,0.04) !important; }
        .rem-btn { background: none; border: none; cursor: pointer; padding: 8px; border-radius: 8px; color: rgba(255,255,255,0.25); font-size: 16px; line-height:1; transition: color .15s, background .15s; }
        .rem-btn:hover { color: #ef4444; background: rgba(239,68,68,0.1); }
      `}</style>

      {/* Nav */}
      <nav style={{
        padding: '16px 20px',
        paddingTop: 'calc(16px + env(safe-area-inset-top))',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Link href="/scout/busca" style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.45)',
          textDecoration: 'none', padding: '6px 12px',
          borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.04)',
        }}>
          ← Busca
        </Link>
        <span style={{ fontSize: '15px', fontWeight: 800, color: 'white' }}>
          ⭐ Favoritos
        </span>
        <div style={{ width: '80px' }} />
      </nav>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '28px 20px 32px' }}>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ height: '72px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        ) : atletas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⭐</div>
            <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 800 }}>
              Nenhum atleta salvo
            </h2>
            <p style={{ margin: '0 0 28px', fontSize: '14px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
              Explore os atletas e toque em ☆ para salvar os que mais{' '}
              <span style={{ color: '#fbbf24', fontWeight: 600 }}>chamarem atenção.</span>
            </p>
            <Link href="/scout/busca" style={{
              display: 'inline-block', padding: '13px 28px', borderRadius: '14px',
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
              color: '#22c55e', fontWeight: 700, fontSize: '14px', textDecoration: 'none',
            }}>
              🔍 Buscar atletas →
            </Link>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '20px' }}>
              <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 900 }}>
                Atletas salvos
              </h1>
              <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
                {atletas.length} atleta{atletas.length !== 1 ? 's' : ''} na sua lista
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {atletas.map((a, idx) => {
                const initials = getInitials(a.nome)
                const pos      = posAbrev(a.posicao)
                return (
                  <div
                    key={a.id}
                    className="fav-card"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '14px 16px',
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: '16px',
                      animationDelay: `${idx * 0.05}s`,
                      opacity: 0,
                    }}
                  >
                    <Link href={`/jogador/${a.id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '50%',
                        background: a.avatar_url ? 'transparent' : 'linear-gradient(135deg,#15803d,#4ade80)',
                        overflow: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '15px', fontWeight: 900, color: 'white',
                        border: '1.5px solid rgba(34,197,94,0.25)',
                      }}>
                        {a.avatar_url
                          ? <img src={a.avatar_url} alt={a.nome} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                          : initials}
                      </div>
                    </Link>

                    <Link href={`/jogador/${a.id}`} style={{ flex: 1, textDecoration: 'none', minWidth: 0 }}>
                      <p style={{ margin: '0 0 3px', fontSize: '15px', fontWeight: 700, color: 'white', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {a.nome}
                      </p>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {pos && (
                          <span style={{
                            fontSize: '10px', fontWeight: 800, color: '#22c55e',
                            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                            borderRadius: '6px', padding: '1px 7px',
                          }}>
                            {pos}
                          </span>
                        )}
                        {a.posicao && (
                          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)' }}>
                            {a.posicao}
                          </span>
                        )}
                      </div>
                    </Link>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <Link href={`/jogador/${a.id}`} style={{
                        padding: '7px 14px', borderRadius: '10px',
                        background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                        color: '#22c55e', fontWeight: 700, fontSize: '12px', textDecoration: 'none',
                      }}>
                        Ver →
                      </Link>
                      <button
                        className="rem-btn"
                        onClick={() => handleRemover(a.id)}
                        disabled={removing === a.id}
                        title="Remover dos favoritos"
                      >
                        {removing === a.id ? '…' : '✕'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <Link href="/scout/busca" style={{
                display: 'inline-block', padding: '12px 24px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontSize: '13px', textDecoration: 'none',
              }}>
                ← Continuar buscando
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
