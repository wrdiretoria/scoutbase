'use client'

/**
 * /scout/dashboard — Área logada do scout.
 * Mostra: cartão do scout, favoritos salvos, acesso rápido à busca.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type ScoutMeta = {
  nome:         string
  organizacao?: string
  email?:       string
  favoritos:    string[]
  avatar_url?:  string
}

type AtletaFav = {
  id:         string
  nome:       string
  posicao:    string
  avatar_url: string | null
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

export default function ScoutDashboardPage() {
  const router = useRouter()
  const [scout,    setScout]    = useState<ScoutMeta | null>(null)
  const [atletas,  setAtletas]  = useState<AtletaFav[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const meta = user.user_metadata as Record<string, unknown>
      if (meta?.tipo !== 'scout') { router.push('/scout/busca'); return }

      const favoritos: string[] = (meta.favoritos as string[] | null) ?? []

      setScout({
        nome:        (meta.nome        as string) ?? 'Scout',
        organizacao: (meta.organizacao as string | undefined),
        email:       user.email,
        favoritos,
        avatar_url:  undefined,
      })

      // Carrega dados dos favoritos
      if (favoritos.length > 0) {
        try {
          const res = await fetch('/api/atleta/nomes', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ ids: favoritos }),
          })
          if (res.ok) {
            const data = await res.json() as AtletaFav[]
            const ordered = favoritos
              .map(id => data.find(a => a.id === id))
              .filter((a): a is AtletaFav => !!a)
            setAtletas(ordered)
          }
        } catch { /* silencia */ }
      }

      setLoading(false)
    }
    load()
  }, [router])

  async function handleSair() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main style={{ background: '#06100a', minHeight: '100dvh', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`.sk{background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%);background-size:200% 100%;animation:sk 1.4s infinite}@keyframes sk{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="sk" style={{ height: 200, borderRadius: 20 }} />
          <div className="sk" style={{ height: 72,  borderRadius: 16 }} />
          <div className="sk" style={{ height: 72,  borderRadius: 16 }} />
        </div>
      </main>
    )
  }
  if (!scout) return null

  const initials    = getInitials(scout.nome)
  const primeiroNome = scout.nome.split(' ')[0]

  return (
    <main style={{
      background: '#06100a', minHeight: '100dvh',
      fontFamily: 'system-ui, sans-serif', color: 'white',
      padding: '0 0 40px',
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .a1 { animation: fadeUp .4s ease forwards 0s;   opacity: 0 }
        .a2 { animation: fadeUp .4s ease forwards .1s;  opacity: 0 }
        .a3 { animation: fadeUp .4s ease forwards .2s;  opacity: 0 }
        .a4 { animation: fadeUp .4s ease forwards .32s; opacity: 0 }
        .quick { display:flex; align-items:center; gap:14px; padding:15px 18px; border-radius:16px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.025); text-decoration:none; color:white; transition:background .2s, border-color .2s; }
        .quick:hover { background:rgba(255,255,255,0.05); border-color:rgba(34,197,94,0.25); }
        .fav-row { display:flex; align-items:center; gap:12px; padding:13px 16px; border-radius:14px; border:1px solid rgba(255,255,255,0.07); background:rgba(255,255,255,0.025); text-decoration:none; color:white; transition:background .2s, border-color .2s; }
        .fav-row:hover { border-color:rgba(251,191,36,0.25); background:rgba(255,255,255,0.04); }
      `}</style>

      {/* Nav */}
      <nav style={{
        padding: '16px 20px', paddingTop: 'calc(16px + env(safe-area-inset-top))',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Link href="/" style={{ fontSize: '15px', fontWeight: 800, color: 'white', textDecoration: 'none' }}>
          ⚽ MEU <span style={{ color: '#22c55e' }}>CRAQUE</span>
        </Link>
        <button onClick={handleSair} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '13px', cursor: 'pointer' }}>
          Sair
        </button>
      </nav>

      <div style={{ maxWidth: 420, margin: '0 auto', padding: '28px 20px' }}>

        {/* ── Card do scout ── */}
        <div className="a1" style={{
          borderRadius: 22, overflow: 'hidden', marginBottom: 20,
          background: 'linear-gradient(160deg, #1a1a0a 0%, #2a1f00 50%, #1a1a0a 100%)',
          border: '1px solid rgba(251,191,36,0.25)',
          boxShadow: '0 0 40px rgba(251,191,36,0.08), 0 20px 60px rgba(0,0,0,0.5)',
        }}>
          {/* Top stripe */}
          <div style={{ height: 3, background: 'linear-gradient(90deg, #78350f, #fbbf24 40%, #f59e0b 60%, #78350f)' }} />

          <div style={{ padding: '24px 24px 22px' }}>
            {/* Badge */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)',
                borderRadius: 100, padding: '4px 14px',
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }} />
                <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.2em', color: '#fbbf24', textTransform: 'uppercase' }}>
                  Scout de Futebol
                </span>
              </div>
            </div>

            {/* Avatar + info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #78350f, #d97706)',
                border: '2px solid rgba(251,191,36,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 900, color: 'white',
                boxShadow: '0 0 24px rgba(251,191,36,0.2)',
              }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  {scout.nome}
                </h1>
                <p style={{ margin: '0 0 2px', fontSize: 13, color: '#fbbf24', fontWeight: 600 }}>
                  {scout.organizacao ?? 'Scout independente'}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>
                  {scout.email}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 20 }}>
              {[
                { val: scout.favoritos.length, label: 'Atletas salvos', color: '#fbbf24' },
                { val: '∞',                    label: 'Buscas disponíveis', color: '#22c55e' },
              ].map((s, i) => (
                <div key={i} style={{
                  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(251,191,36,0.08)',
                  borderRadius: 12, padding: '12px 14px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: s.color, lineHeight: 1, letterSpacing: '-0.03em' }}>{s.val}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CTA Busca ── */}
        <div className="a2" style={{ marginBottom: 14 }}>
          <Link href="/scout/busca" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            padding: '18px 22px', borderRadius: 18, textDecoration: 'none',
            background: 'linear-gradient(135deg, #14532d 0%, #166534 100%)',
            border: '1px solid rgba(34,197,94,0.3)',
            boxShadow: '0 8px 28px rgba(34,197,94,0.15)',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>🔍</span>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 800, color: 'white' }}>Buscar atletas</p>
                <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Filtrar por posição, categoria e cidade</p>
              </div>
            </span>
            <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.4)' }}>→</span>
          </Link>
        </div>

        {/* ── Favoritos recentes ── */}
        <div className="a3" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase' }}>
              ⭐ Favoritos recentes
            </p>
            {atletas.length > 0 && (
              <Link href="/scout/favoritos" style={{ fontSize: 12, color: '#fbbf24', fontWeight: 700, textDecoration: 'none' }}>
                Ver todos →
              </Link>
            )}
          </div>

          {atletas.length === 0 ? (
            <div style={{
              padding: '20px', borderRadius: 16, textAlign: 'center',
              border: '1px dashed rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)',
            }}>
              <p style={{ margin: '0 0 4px', fontSize: 24 }}>⭐</p>
              <p style={{ margin: '0 0 10px', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                Nenhum atleta salvo ainda
              </p>
              <Link href="/scout/busca" style={{ fontSize: 12, color: '#22c55e', fontWeight: 700, textDecoration: 'none' }}>
                Explorar atletas →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {atletas.slice(0, 3).map(a => {
                const ini = getInitials(a.nome)
                const pos = posAbrev(a.posicao)
                return (
                  <Link key={a.id} href={`/jogador/${a.id}`} className="fav-row">
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                      background: a.avatar_url ? 'transparent' : 'linear-gradient(135deg,#15803d,#4ade80)',
                      overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 900,
                    }}>
                      {a.avatar_url
                        ? <img src={a.avatar_url} alt={a.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : ini
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {a.nome}
                      </p>
                      {pos && (
                        <span style={{
                          fontSize: 10, fontWeight: 800, color: '#22c55e',
                          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                          borderRadius: 6, padding: '1px 7px',
                        }}>
                          {pos}
                        </span>
                      )}
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 18 }}>›</span>
                  </Link>
                )
              })}
              {atletas.length > 3 && (
                <Link href="/scout/favoritos" style={{
                  padding: '11px', borderRadius: 12, textAlign: 'center',
                  border: '1px solid rgba(251,191,36,0.15)', background: 'rgba(251,191,36,0.05)',
                  color: '#fbbf24', fontWeight: 700, fontSize: 13, textDecoration: 'none',
                }}>
                  Ver mais {atletas.length - 3} favorito{atletas.length - 3 !== 1 ? 's' : ''} →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ── Ranking ── */}
        <div className="a4">
          <Link href="/ranking" className="quick">
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>🏆</div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>Ranking global</p>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>Top atletas por OVR · filtros disponíveis</p>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: 20 }}>›</span>
          </Link>
        </div>

        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 9, color: 'rgba(255,255,255,0.06)', letterSpacing: '0.1em' }}>
            ⚽ meucraque.com · O futebol começa aqui
          </p>
        </div>

      </div>
    </main>
  )
}
