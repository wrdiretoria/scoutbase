'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import html2canvas from 'html2canvas'

// ── Types ─────────────────────────────────────────────────────────────────────

type TreinadorData = {
  nome:          string
  avatar_url?:   string
  especialidade?: string
  cidade?:       string
  bio?:          string
}

type Stats = { av: number; at: number; dest: number }

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

function useCounter(target: number, delay = 600, duration = 900) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now()
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1)
        setValue(Math.round((1 - Math.pow(1 - p, 3)) * target))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(t)
  }, [target, delay, duration])
  return value
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TreinadorCompartilharPage() {
  const router = useRouter()

  const [treinador, setTreinador] = useState<TreinadorData | null>(null)
  const [stats,     setStats]     = useState<Stats>({ av: 0, at: 0, dest: 0 })
  const [loading,   setLoading]   = useState(true)

  const [shareStatus,  setShareStatus]  = useState<'idle' | 'sharing'>('idle')
  const [downloading,  setDownloading]  = useState(false)
  const [copied,       setCopied]       = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      const p = profile as Record<string, unknown> | null

      setTreinador({
        nome:          (p?.nome as string)          ?? user.user_metadata?.nome ?? 'Treinador',
        avatar_url:    p?.avatar_url as string | undefined,
        especialidade: (p?.especialidade as string) ?? user.user_metadata?.especialidade,
        cidade:        p?.cidade as string | undefined,
        bio:           p?.bio as string | undefined,
      })

      try {
        const [{ count: totAv }, { data: pRows }, { count: totDest }] = await Promise.all([
          supabase.from('avaliacoes').select('*', { count: 'exact', head: true }).eq('treinador_id', user.id),
          supabase.from('avaliacoes').select('profile_id').eq('treinador_id', user.id),
          supabase.from('avaliacoes').select('*', { count: 'exact', head: true }).eq('treinador_id', user.id).gte('nota_geral', 75),
        ])
        const uniqueAtletas = new Set((pRows ?? []).map(r => r.profile_id)).size
        setStats({ av: totAv ?? 0, at: uniqueAtletas, dest: totDest ?? 0 })
      } catch { /* table may not exist yet */ }

      setLoading(false)
    }
    load()
  }, [router])

  const animAv   = useCounter(stats.av,   700, 900)
  const animAt   = useCounter(stats.at,   800, 900)
  const animDest = useCounter(stats.dest, 900, 900)

  // ── Ações ─────────────────────────────────────────────────────────────────

  async function captureCard() {
    if (!cardRef.current) return null
    return html2canvas(cardRef.current, {
      useCORS: true, allowTaint: false,
      backgroundColor: null, scale: 2,
      logging: false, imageTimeout: 8000,
    })
  }

  async function handleShare() {
    setShareStatus('sharing')
    try {
      const canvas = await captureCard()
      if (!canvas) return
      const blob: Blob = await new Promise(res => canvas.toBlob(b => res(b!), 'image/png'))
      const nome = treinador?.nome ?? 'Treinador'
      const file = new File([blob], `${nome.replace(/\s+/g, '_')}_MeuCraque.png`, { type: 'image/png' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${nome} · Meu Craque`,
          text: `⚽ Meu card de treinador no Meu Craque!${treinador?.especialidade ? ` ${treinador.especialidade}` : ''}${treinador?.cidade ? ` · ${treinador.cidade}` : ''}`,
        })
      } else if (navigator.share) {
        await navigator.share({ title: `${nome} · Meu Craque`, text: '⚽ Meu card de treinador no Meu Craque!' })
      } else {
        const url = URL.createObjectURL(blob)
        const a = Object.assign(document.createElement('a'), { href: url, download: file.name })
        document.body.appendChild(a); a.click(); document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch { /* cancelado */ }
    setShareStatus('idle')
  }

  async function handleDownload() {
    setDownloading(true)
    try {
      const canvas = await captureCard()
      if (!canvas) return
      const a = Object.assign(document.createElement('a'), {
        href: canvas.toDataURL('image/png'),
        download: `${(treinador?.nome ?? 'Treinador').replace(/\s+/g, '_')}_MeuCraque.png`,
      })
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
    } catch { handleShare() }
    setDownloading(false)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText('https://meucraque.com.br')
      setCopied(true); setTimeout(() => setCopied(false), 3000)
    } catch { /* sem permissão */ }
  }

  // ── Skeleton ──────────────────────────────────────────────────────────────

  if (loading) return (
    <main style={{ background: '#080400', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: '280px', height: '500px', borderRadius: '24px',
        background: 'linear-gradient(90deg,rgba(251,191,36,0.04) 25%,rgba(251,191,36,0.08) 50%,rgba(251,191,36,0.04) 75%)',
        backgroundSize: '200% 100%', animation: 'skelShimmer 1.4s infinite',
      }} />
      <style>{`@keyframes skelShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </main>
  )

  if (!treinador) return null

  const primeiroNome = treinador.nome.split(' ')[0]
  const sobrenome    = treinador.nome.split(' ').slice(1).join(' ')
  const initials     = getInitials(treinador.nome)

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main style={{
      background: '#080400',
      minHeight: '100dvh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '28px 20px',
      paddingTop: 'max(28px, env(safe-area-inset-top))',
      paddingBottom: '40px',
      fontFamily: 'system-ui, sans-serif',
    }}>

      <style>{`
        @keyframes fadeUp    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cardReveal{
          0%  { opacity:0; transform:translateY(52px) scale(.88) }
          60% { opacity:1; transform:translateY(-5px) scale(1.01) }
          100%{ opacity:1; transform:translateY(0)    scale(1)    }
        }
        @keyframes glowBreath{ 0%,100%{opacity:.65;transform:scale(1)} 50%{opacity:1;transform:scale(1.1)} }
        @keyframes shimmerLine{ 0%{transform:translateX(-100%)} 100%{transform:translateX(320%)} }
        @keyframes shimmerCard{ 0%{left:-50%} 100%{left:150%} }
        @keyframes dotPulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.65)} }
        @keyframes cardPulse  {
          0%,100%{ box-shadow:0 0 0 1px rgba(251,191,36,0.25),0 0 50px rgba(251,191,36,0.12),0 36px 80px rgba(0,0,0,.98) }
          50%    { box-shadow:0 0 0 1px rgba(251,191,36,0.45),0 0 90px rgba(251,191,36,0.28),0 36px 80px rgba(0,0,0,.98) }
        }

        .a-header  { animation:fadeUp      .5s ease forwards .05s; opacity:0 }
        .a-title   { animation:fadeUp      .5s ease forwards .12s; opacity:0 }
        .a-card    { animation:cardReveal  .9s cubic-bezier(.22,.68,0,1.1) forwards .3s; opacity:0 }
        .a-phrase  { animation:fadeUp      .5s ease forwards 1s;   opacity:0 }
        .a-actions { animation:fadeUp      .5s ease forwards 1.15s;opacity:0 }
        .card-pulse{ animation:cardPulse   4.5s ease-in-out infinite 2s }

        .btn-share {
          width:100%; padding:17px; border-radius:15px; border:none;
          background:linear-gradient(135deg,#d97706 0%,#fbbf24 55%,#d97706 100%);
          color:#1a0800; font-weight:900; font-size:17px; letter-spacing:.03em;
          cursor:pointer; font-family:system-ui,sans-serif;
          box-shadow:0 0 48px rgba(251,191,36,0.4),0 6px 24px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.28);
          transition:opacity .2s, transform .15s;
        }
        .btn-share:active{ opacity:.88; transform:scale(.98) }

        .btn-glass {
          width:100%; padding:14px; border-radius:13px;
          border:1px solid rgba(251,191,36,0.18); background:rgba(251,191,36,0.05);
          color:rgba(255,255,255,.65); font-size:15px; font-weight:700;
          cursor:pointer; font-family:system-ui,sans-serif;
          transition:border-color .2s,background .2s,color .2s;
        }
        .btn-glass:hover { border-color:rgba(251,191,36,0.3);background:rgba(251,191,36,0.09);color:rgba(255,255,255,.85) }
        .btn-glass:active{ transform:scale(.99) }

        .btn-ghost {
          width:100%; padding:13px; border-radius:13px;
          border:1px solid rgba(255,255,255,.07); background:transparent;
          color:rgba(255,255,255,.3); font-size:14px; font-weight:600;
          cursor:pointer; font-family:system-ui,sans-serif;
          transition:border-color .2s,color .2s;
        }
        .btn-ghost:hover{ border-color:rgba(255,255,255,.16);color:rgba(255,255,255,.5) }
      `}</style>

      {/* ── Atmosfera ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
          width: '800px', height: '700px', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(251,191,36,0.10) 0%, rgba(217,119,6,0.04) 40%, transparent 65%)',
          animation: 'glowBreath 6s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', right: '-20%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(251,191,36,0.04) 0%, transparent 65%)',
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* ── Header ── */}
        <div className="a-header" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <button onClick={() => router.back()} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            color: 'rgba(255,255,255,0.35)', fontSize: '13px', fontWeight: 600,
            fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', gap: '5px',
          }}>
            ← Voltar
          </button>
          <Link href="/treinador/dashboard" style={{ fontSize: '14px', fontWeight: 800, color: 'white', textDecoration: 'none', opacity: 0.6 }}>
            ⚽ MEU <span style={{ color: '#fbbf24' }}>CRAQUE</span>
          </Link>
          <div style={{ width: '60px' }} />
        </div>

        {/* ── Título ── */}
        <div className="a-title" style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '7px',
            padding: '5px 14px', borderRadius: '100px', marginBottom: '14px',
            background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)',
          }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 8px #fbbf24', animation: 'dotPulse 2s ease-in-out infinite' }} />
            <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.14em', color: 'rgba(251,191,36,0.85)', textTransform: 'uppercase' }}>
              Card oficial · Treinador
            </span>
          </div>
          <h1 style={{
            margin: 0, fontSize: 'clamp(30px,9vw,38px)', fontWeight: 900,
            color: 'white', letterSpacing: '-0.04em', lineHeight: 1.05,
          }}>
            Sua identidade<br />
            <span style={{ color: '#fbbf24', textShadow: '0 0 40px rgba(251,191,36,0.4)' }}>no futebol.</span>
          </h1>
        </div>

        {/* ══════════════════════════════════════
            O CARD — protagonista total
        ══════════════════════════════════════ */}
        <div className="a-card" style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <div style={{ position: 'relative' }}>

            {/* Glow atrás */}
            <div style={{
              position: 'absolute', inset: '-35px', zIndex: 0, borderRadius: '60px',
              background: 'radial-gradient(ellipse, rgba(251,191,36,0.2) 0%, transparent 65%)',
              filter: 'blur(20px)',
            }} />

            {/* Corner accents âmbar */}
            <div ref={cardRef} style={{ position: 'relative', width: 'min(300px,88vw)', zIndex: 1 }}>
              {[
                { top: -1, left: -1,  borderTop: '1.5px solid rgba(251,191,36,0.8)', borderLeft:  '1.5px solid rgba(251,191,36,0.8)', borderTopLeftRadius:     '28px' },
                { top: -1, right: -1, borderTop: '1.5px solid rgba(251,191,36,0.8)', borderRight: '1.5px solid rgba(251,191,36,0.8)', borderTopRightRadius:    '28px' },
                { bottom: -1, left: -1,  borderBottom: '1.5px solid rgba(251,191,36,0.35)', borderLeft:  '1.5px solid rgba(251,191,36,0.35)', borderBottomLeftRadius:  '28px' },
                { bottom: -1, right: -1, borderBottom: '1.5px solid rgba(251,191,36,0.35)', borderRight: '1.5px solid rgba(251,191,36,0.35)', borderBottomRightRadius: '28px' },
              ].map((s, i) => (
                <div key={i} style={{ position: 'absolute', width: '22px', height: '22px', zIndex: 20, pointerEvents: 'none', ...s }} />
              ))}

              {/* Card body */}
              <div className="card-pulse" style={{
                width: '100%', borderRadius: '28px', overflow: 'hidden',
                position: 'relative',
                background: 'linear-gradient(170deg, #1a0c00 0%, #2e1600 35%, #110800 100%)',
              }}>

                {/* Textura de pontos */}
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 0, opacity: 0.022,
                  backgroundImage: 'radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)',
                  backgroundSize: '18px 18px',
                }} />

                {/* Reflexo diagonal */}
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 45%, transparent 55%, rgba(0,0,0,0.15) 100%)',
                }} />

                {/* Shimmer line topo */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', zIndex: 15, background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.9), transparent)', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, bottom: 0, width: '40%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)', animation: 'shimmerLine 3.5s ease-in-out infinite 2.5s' }} />
                </div>

                {/* Sheen sweep único */}
                <div style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none', overflow: 'hidden' }}>
                  <div style={{
                    position: 'absolute', top: '-20%', bottom: '-20%', width: '45%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,220,100,0.07), transparent)',
                    transform: 'skewX(-12deg)', left: '-50%',
                    animation: 'shimmerCard 1s cubic-bezier(.4,0,.2,1) forwards 1.8s',
                  }} />
                </div>

                {/* ── Área foto ── */}
                <div style={{ position: 'relative', height: '280px', overflow: 'hidden', zIndex: 2 }}>

                  {treinador.avatar_url ? (
                    <img
                      src={treinador.avatar_url} alt={treinador.nome}
                      crossOrigin="anonymous"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 18%', display: 'block', filter: 'contrast(1.07) saturate(1.1) brightness(0.95)' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      background: 'linear-gradient(160deg, #2d1200 0%, #1a0a00 50%, #0d0500 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                    }}>
                      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 55% at 50% 42%, rgba(251,191,36,0.12) 0%, transparent 70%)' }} />
                      <div style={{
                        position: 'relative', zIndex: 1,
                        width: '110px', height: '110px', borderRadius: '50%',
                        background: 'linear-gradient(145deg, #78350f, #d97706, #fbbf24)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '36px', fontWeight: 900, color: 'white',
                        boxShadow: '0 0 0 1px rgba(251,191,36,0.35), 0 0 60px rgba(251,191,36,0.4), 0 0 120px rgba(251,191,36,0.15)',
                      }}>
                        {initials}
                      </div>
                    </div>
                  )}

                  {/* Overlays cinematográficos âmbar */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,6,0,1) 0%, rgba(13,6,0,0.88) 20%, rgba(13,6,0,0.4) 48%, rgba(13,6,0,0.06) 72%, transparent 100%)' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(13,6,0,0.5) 0%, transparent 28%, transparent 72%, rgba(13,6,0,0.35) 100%)' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 28%)' }} />
                  {treinador.avatar_url && (
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 100% 70% at 50% 0%, rgba(251,191,36,0.05) 0%, transparent 65%)', mixBlendMode: 'screen' as const }} />
                  )}

                  {/* Badge especialidade */}
                  {treinador.especialidade && (
                    <div style={{
                      position: 'absolute', top: '14px', right: '14px', zIndex: 8,
                      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(251,191,36,0.45)', borderRadius: '10px',
                      padding: '5px 12px', fontSize: '10px', fontWeight: 800,
                      color: '#fbbf24', letterSpacing: '0.10em',
                      boxShadow: '0 0 16px rgba(251,191,36,0.2)',
                      textShadow: '0 0 12px rgba(251,191,36,0.5)',
                    }}>
                      {treinador.especialidade}
                    </div>
                  )}

                  {/* Nome sobre a foto */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 8, padding: '0 18px 18px' }}>
                    <p style={{
                      margin: '0 0 3px', fontSize: '32px', fontWeight: 900, color: 'white',
                      letterSpacing: '-0.04em', lineHeight: 1,
                      textShadow: '0 2px 24px rgba(0,0,0,.95), 0 0 48px rgba(251,191,36,0.1)',
                    }}>
                      {primeiroNome}
                    </p>
                    {sobrenome && (
                      <p style={{
                        margin: 0, fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)',
                        textTransform: 'uppercase', letterSpacing: '0.16em',
                        textShadow: '0 1px 10px rgba(0,0,0,.95)',
                      }}>
                        {sobrenome}
                      </p>
                    )}
                  </div>
                </div>

                {/* ── Faixa inferior ── */}
                <div style={{ position: 'relative', zIndex: 2, padding: '14px 18px 18px' }}>

                  {/* Divisor âmbar */}
                  <div style={{
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.6), transparent)',
                    marginBottom: '13px', boxShadow: '0 0 10px rgba(251,191,36,0.15)',
                  }} />

                  {/* Role + Cidade */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center',
                      background: 'linear-gradient(135deg, rgba(251,191,36,0.14), rgba(251,191,36,0.07))',
                      border: '1px solid rgba(251,191,36,0.3)', borderRadius: '8px', padding: '5px 13px',
                      boxShadow: '0 0 14px rgba(251,191,36,0.1)',
                    }}>
                      <span style={{ fontSize: '11px', fontWeight: 900, color: '#fbbf24', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                        ⚡ Treinador
                      </span>
                    </div>
                    {treinador.cidade && (
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                        · {treinador.cidade}
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    {[
                      { val: animAv,   label: 'Avaliações' },
                      { val: animAt,   label: 'Atletas'    },
                      { val: animDest, label: 'Destaques'  },
                    ].map((s, i) => (
                      <div key={i} style={{
                        background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(251,191,36,0.08)',
                        borderRadius: '10px', padding: '8px 4px', textAlign: 'center', position: 'relative', overflow: 'hidden',
                      }}>
                        {s.val > 0 && (
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #fbbf24, transparent)' }} />
                        )}
                        <div style={{
                          fontSize: '22px', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.04em',
                          color: s.val > 0 ? '#fbbf24' : 'rgba(255,255,255,0.15)',
                          textShadow: s.val > 0 ? '0 0 18px rgba(251,191,36,0.6)' : 'none',
                        }}>
                          {s.val}
                        </div>
                        <div style={{ fontSize: '7.5px', fontWeight: 800, letterSpacing: '0.07em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', marginTop: '4px' }}>
                          {s.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Watermark */}
                  <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.06))' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(251,191,36,0.3)' }} />
                      <span style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.13)', textTransform: 'uppercase' }}>MEU CRAQUE</span>
                      <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(251,191,36,0.3)' }} />
                    </div>
                    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.06))' }} />
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Frase emocional ── */}
        <p className="a-phrase" style={{
          margin: '0 0 28px', fontSize: '13px', color: 'rgba(255,255,255,0.28)',
          textAlign: 'center', lineHeight: 1.7,
        }}>
          Seu legado no futebol começa aqui.<br />
          <span style={{ color: 'rgba(251,191,36,0.55)', fontWeight: 700 }}>Compartilhe com escolas, atletas e o mundo.</span>
        </p>

        {/* ── Ações ── */}
        <div className="a-actions" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>

          <button className="btn-share" onClick={handleShare} disabled={shareStatus === 'sharing'} style={{ opacity: shareStatus === 'sharing' ? 0.7 : 1 }}>
            {shareStatus === 'sharing' ? '…' : '📲 Compartilhar meu card'}
          </button>

          <button className="btn-glass" onClick={handleDownload} disabled={downloading}>
            {downloading ? 'Baixando…' : '⬇ Baixar imagem'}
          </button>

          <button className="btn-ghost" onClick={handleCopy}>
            {copied ? '✓ Link copiado!' : '🔗 Copiar link'}
          </button>

        </div>

        {/* ── Separador ── */}
        <div style={{ width: '100%', marginTop: '28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.14)', fontWeight: 600, letterSpacing: '0.08em' }}>ou continue</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
        </div>

        <Link href="/treinador/dashboard" style={{
          marginTop: '14px', display: 'block', width: '100%', textAlign: 'center',
          fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textDecoration: 'none',
        }}>
          Voltar ao dashboard →
        </Link>

        <p style={{ marginTop: '28px', fontSize: '10px', color: 'rgba(255,255,255,0.08)', textAlign: 'center' }}>
          ⚽ MEU <span style={{ color: 'rgba(251,191,36,0.25)' }}>CRAQUE</span> · Construindo o futebol brasileiro.
        </p>

      </div>
    </main>
  )
}
