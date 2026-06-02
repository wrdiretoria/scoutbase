'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import html2canvas from 'html2canvas'
import { getInitials } from '@/lib/cardUtils'

// ── Types ─────────────────────────────────────────────────────────────────────

type Treinador = { nome: string; avatar_url?: string; especialidade?: string; cidade?: string; treinadorId?: string }
type Stats     = { av: number; at: number; dest: number }

function calcularOVR(av: number, dest: number, temFoto: boolean, temEspecialidade: boolean): number {
  let ovr = 65
  if (temFoto)          ovr += 12
  if (temEspecialidade) ovr +=  8
  ovr += Math.min(av   * 2, 10)
  ovr += Math.min(dest * 3, 10)
  return Math.min(ovr, 99)
}

function useCounter(target: number, delay = 500, duration = 900) {
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

  const [treinador, setTreinador] = useState<Treinador | null>(null)
  const [stats,     setStats]     = useState<Stats>({ av: 0, at: 0, dest: 0 })
  const [loading,   setLoading]   = useState(true)

  const cardRef = useRef<HTMLDivElement>(null)
  const [shareStatus, setShareStatus] = useState<'idle' | 'sharing'>('idle')
  const [downloading, setDownloading] = useState(false)
  const [copied,      setCopied]      = useState(false)

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
        treinadorId:   p?.athlete_id as string | undefined,
      })

      try {
        const [{ count: totAv }, { data: pRows }, { count: totDest }] = await Promise.all([
          supabase.from('avaliacoes').select('*', { count: 'exact', head: true }).eq('professor_id', user.id),
          supabase.from('avaliacoes').select('aluno_id').eq('professor_id', user.id),
          supabase.from('avaliacoes').select('*', { count: 'exact', head: true }).eq('professor_id', user.id).gte('scout_score', 75),
        ])
        setStats({ av: totAv ?? 0, at: new Set((pRows ?? []).map(r => r.aluno_id)).size, dest: totDest ?? 0 })
      } catch { /* table may not exist yet */ }

      setLoading(false)
    }
    load()
  }, [router])

  // ── OVR e contadores ──────────────────────────────────────────────────────

  const ovr     = treinador ? calcularOVR(stats.av, stats.dest, !!treinador.avatar_url, !!treinador.especialidade) : 65
  const ovrAnim = useCounter(ovr, 700, 1000)

  // ── Captura ────────────────────────────────────────────────────────────────

  async function captureCard() {
    if (!cardRef.current) return null
    return html2canvas(cardRef.current, {
      useCORS: true, allowTaint: false,
      backgroundColor: '#0d0600',   // fundo âmbar escuro — evita branco transparente
      scale: 2, logging: false, imageTimeout: 8000,
    })
  }

  async function handleShare() {
    setShareStatus('sharing')
    try {
      const canvas = await captureCard(); if (!canvas) return
      const blob: Blob = await new Promise(res => canvas.toBlob(b => res(b!), 'image/png'))
      const nome = treinador?.nome ?? 'Treinador'
      const file = new File([blob], `${nome.replace(/\s+/g, '_')}_Treinador_MeuCraque.png`, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${nome} · Meu Craque`, text: `⚽ Treinador OVR ${ovr} no Meu Craque!${treinador?.especialidade ? ` · ${treinador.especialidade}` : ''}` })
      } else if (navigator.share) {
        await navigator.share({ title: `${nome} · Meu Craque`, text: `⚽ Treinador OVR ${ovr} no Meu Craque!` })
      } else {
        const url = URL.createObjectURL(blob)
        const a = Object.assign(document.createElement('a'), { href: url, download: file.name })
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
      }
    } catch { /* cancelado */ }
    setShareStatus('idle')
  }

  async function handleDownload() {
    setDownloading(true)
    try {
      const canvas = await captureCard(); if (!canvas) return
      const a = Object.assign(document.createElement('a'), {
        href: canvas.toDataURL('image/png'),
        download: `${(treinador?.nome ?? 'Treinador').replace(/\s+/g, '_')}_MeuCraque.png`,
      })
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
    } catch { handleShare() }
    setDownloading(false)
  }

  async function handleCopy() {
    try { await navigator.clipboard.writeText(window.location.origin); setCopied(true); setTimeout(() => setCopied(false), 3000) } catch { /* sem permissão */ }
  }

  // ── Skeleton ──────────────────────────────────────────────────────────────

  if (loading) return (
    <main style={{ background: '#080400', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes sk{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ width: '290px', aspectRatio: '3/4', borderRadius: '24px', background: 'linear-gradient(90deg,rgba(251,191,36,.04) 25%,rgba(251,191,36,.09) 50%,rgba(251,191,36,.04) 75%)', backgroundSize: '200% 100%', animation: 'sk 1.4s infinite' }} />
    </main>
  )

  if (!treinador) return null

  const primeiroNome = treinador.nome.split(' ')[0]
  const sobrenome    = treinador.nome.split(' ').slice(1).join(' ')
  const initials     = getInitials(treinador.nome)

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main style={{
      background: '#080400', minHeight: '100dvh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '28px 20px',
      paddingTop: 'max(28px, env(safe-area-inset-top))',
      paddingBottom: '40px',
      fontFamily: 'system-ui, sans-serif',
    }}>

      <style>{`
        @keyframes fadeUp    {from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes cardReveal{
          0%  {opacity:0;transform:translateY(56px) scale(.86)}
          65% {opacity:1;transform:translateY(-6px)  scale(1.02)}
          100%{opacity:1;transform:translateY(0)     scale(1)}
        }
        @keyframes glowBreath{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.1)}}
        @keyframes shimmerCard{0%{left:-60%}100%{left:160%}}
        @keyframes dotPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.65)}}
        @keyframes cardPulse{
          0%,100%{box-shadow:0 0 0 1px rgba(251,191,36,.25),0 0 60px rgba(251,191,36,.12),0 40px 100px rgba(0,0,0,.98)}
          50%    {box-shadow:0 0 0 1px rgba(251,191,36,.45),0 0 100px rgba(251,191,36,.28),0 40px 100px rgba(0,0,0,.98)}
        }

        .a1{animation:fadeUp .5s ease forwards .05s;opacity:0}
        .a2{animation:fadeUp .5s ease forwards .1s;opacity:0}
        .a3{animation:cardReveal .95s cubic-bezier(.22,.68,0,1.1) forwards .3s;opacity:0}
        .a4{animation:fadeUp .5s ease forwards 1.05s;opacity:0}
        .a5{animation:fadeUp .5s ease forwards 1.2s;opacity:0}

        .card-pulse{animation:cardPulse 4.5s ease-in-out infinite 2s}

        .btn-primary{
          width:100%;padding:17px;border-radius:15px;border:none;
          background:linear-gradient(135deg,#d97706 0%,#fbbf24 55%,#d97706 100%);
          color:#1a0800;font-weight:900;font-size:17px;letter-spacing:.03em;
          cursor:pointer;font-family:system-ui,sans-serif;
          box-shadow:0 0 48px rgba(251,191,36,.4),0 6px 24px rgba(0,0,0,.5);
          transition:opacity .2s,transform .15s;
        }
        .btn-primary:active{opacity:.88;transform:scale(.98)}
        .btn-glass{
          width:100%;padding:14px;border-radius:13px;
          border:1px solid rgba(251,191,36,.18);background:rgba(251,191,36,.05);
          color:rgba(255,255,255,.6);font-size:15px;font-weight:700;
          cursor:pointer;font-family:system-ui,sans-serif;
          transition:border-color .2s,background .2s,color .2s;
        }
        .btn-glass:hover{border-color:rgba(251,191,36,.3);background:rgba(251,191,36,.09);color:rgba(255,255,255,.85)}
        .btn-glass:active{transform:scale(.99)}
        .btn-ghost{
          width:100%;padding:13px;border-radius:13px;
          border:1px solid rgba(255,255,255,.06);background:transparent;
          color:rgba(255,255,255,.28);font-size:14px;font-weight:600;
          cursor:pointer;font-family:system-ui,sans-serif;
          transition:border-color .2s,color .2s;
        }
        .btn-ghost:hover{border-color:rgba(255,255,255,.14);color:rgba(255,255,255,.48)}
      `}</style>

      {/* Atmosfera âmbar */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
          width: '800px', height: '700px', borderRadius: '50%',
          background: 'radial-gradient(ellipse,rgba(251,191,36,.09) 0%,rgba(217,119,6,.04) 40%,transparent 65%)',
          animation: 'glowBreath 6s ease-in-out infinite',
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Header */}
        <div className="a1" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(255,255,255,.35)', fontSize: '13px', fontWeight: 600, fontFamily: 'system-ui,sans-serif' }}>
            ← Voltar
          </button>
          <Link href="/treinador/dashboard" style={{ fontSize: '14px', fontWeight: 800, color: 'white', textDecoration: 'none', opacity: .55 }}>
            ⚽ <span style={{ color: '#00ff87' }}>MEUCRAQUE</span><span style={{ color: 'white' }}>.com</span>
          </Link>
          <div style={{ width: '60px' }} />
        </div>

        {/* Título */}
        <div className="a2" style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '12px',
            padding: '5px 14px', borderRadius: '100px',
            background: 'rgba(251,191,36,.1)', border: '1px solid rgba(251,191,36,.25)',
          }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 8px #fbbf24', animation: 'dotPulse 2s ease-in-out infinite' }} />
            <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '.14em', color: 'rgba(251,191,36,.85)', textTransform: 'uppercase' }}>Card Oficial · Treinador</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(30px,9vw,38px)', fontWeight: 900, color: 'white', letterSpacing: '-.04em', lineHeight: 1.05 }}>
            Sua identidade<br />
            <span style={{ color: '#fbbf24', textShadow: '0 0 40px rgba(251,191,36,.4)' }}>no futebol.</span>
          </h1>
        </div>

        {/* ══════════ O CARD FIFA ══════════ */}
        <div className="a3" style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          {/* cardRef envolve tudo: glow + card — assim a imagem exportada tem contexto visual */}
          <div ref={cardRef} style={{
            position: 'relative',
            padding: '32px 24px',
            background: 'radial-gradient(ellipse 90% 75% at 50% 35%, rgba(100,40,0,.7) 0%, #080400 65%)',
            borderRadius: '40px',
          }}>

            {/* Glow decorativo âmbar (html2canvas suporta filter:blur) */}
            <div style={{
              position: 'absolute', inset: 0, zIndex: 0, borderRadius: '40px',
              background: 'radial-gradient(ellipse 70% 55% at 50% 30%,rgba(251,191,36,.15) 0%,transparent 60%)',
            }} />

            <div style={{ position: 'relative', width: 'min(290px,86vw)', zIndex: 1 }}>
              {[
                { top: -1, left: -1,     borderTop:    '1.5px solid rgba(251,191,36,.8)', borderLeft:   '1.5px solid rgba(251,191,36,.8)', borderTopLeftRadius:     '24px' },
                { top: -1, right: -1,    borderTop:    '1.5px solid rgba(251,191,36,.8)', borderRight:  '1.5px solid rgba(251,191,36,.8)', borderTopRightRadius:    '24px' },
                { bottom: -1, left: -1,  borderBottom: '1.5px solid rgba(251,191,36,.3)', borderLeft:   '1.5px solid rgba(251,191,36,.3)', borderBottomLeftRadius:  '24px' },
                { bottom: -1, right: -1, borderBottom: '1.5px solid rgba(251,191,36,.3)', borderRight:  '1.5px solid rgba(251,191,36,.3)', borderBottomRightRadius: '24px' },
              ].map((s, i) => <div key={i} style={{ position: 'absolute', width: '20px', height: '20px', zIndex: 20, pointerEvents: 'none', ...s }} />)}

              {/* ── CARD BODY ── */}
              <div className="card-pulse" style={{
                width: '100%', borderRadius: '24px', overflow: 'hidden',
                position: 'relative', aspectRatio: '3 / 4',
              }}>

                {/* FOTO — 100% */}
                {treinador.avatar_url ? (
                  <img
                    src={treinador.avatar_url} alt={treinador.nome}
                    crossOrigin="anonymous"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', display: 'block' }}
                  />
                ) : (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(160deg, #2d1200 0%, #1a0a00 50%, #0d0500 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 55% at 50% 45%,rgba(251,191,36,.12) 0%,transparent 70%)' }} />
                    <div style={{
                      position: 'relative', zIndex: 1, width: '42%', aspectRatio: '1', borderRadius: '50%',
                      background: 'linear-gradient(145deg,#78350f,#d97706,#fbbf24)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 'clamp(28px,10vw,36px)', fontWeight: 900, color: 'white',
                      boxShadow: '0 0 0 1px rgba(251,191,36,.35),0 0 60px rgba(251,191,36,.4)',
                    }}>
                      {initials}
                    </div>
                  </div>
                )}

                {/* Overlays cinematográficos âmbar */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,0,0,.55) 0%,rgba(0,0,0,.08) 30%,transparent 55%,rgba(0,0,0,.15) 65%,rgba(0,0,0,.92) 100%)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right,rgba(0,0,0,.35) 0%,transparent 25%,transparent 75%,rgba(0,0,0,.25) 100%)' }} />

                {/* Sheen sweep */}
                <div style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none', overflow: 'hidden' }}>
                  <div style={{
                    position: 'absolute', top: '-20%', bottom: '-20%', width: '45%',
                    background: 'linear-gradient(90deg,transparent,rgba(255,220,100,.07),transparent)',
                    transform: 'skewX(-12deg)', left: '-60%',
                    animation: 'shimmerCard 1s cubic-bezier(.4,0,.2,1) forwards 1.8s',
                  }} />
                </div>

                {/* ── TOP LEFT: OVR + Role ── */}
                <div style={{ position: 'absolute', top: '16px', left: '18px', zIndex: 10 }}>
                  <div style={{
                    fontSize: '52px', fontWeight: 900, color: 'white', lineHeight: 1,
                    letterSpacing: '-0.04em',
                    textShadow: '0 2px 20px rgba(0,0,0,.9),0 0 40px rgba(251,191,36,.3)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {ovrAnim}
                  </div>
                  <div style={{
                    fontSize: '12px', fontWeight: 900, color: '#fbbf24',
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    textShadow: '0 0 16px rgba(251,191,36,.7)',
                    marginTop: '2px',
                  }}>
                    TRE
                  </div>
                </div>

                {/* ── TOP RIGHT: Especialidade badge ── */}
                {treinador.especialidade && (
                  <div style={{
                    position: 'absolute', top: '16px', right: '16px', zIndex: 10,
                    background: 'rgba(10,5,0,.85)',
                    border: '1px solid rgba(251,191,36,.4)', borderRadius: '9px',
                    padding: '4px 11px',
                    fontSize: '10px', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.1em',
                    textShadow: '0 0 12px rgba(251,191,36,.55)',
                    maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {treinador.especialidade}
                  </div>
                )}

                {/* ── BOTTOM: Nome + info ── */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, padding: '0 18px 20px' }}>
                  <p style={{
                    margin: '0 0 2px',
                    fontSize: 'clamp(26px,8vw,32px)', fontWeight: 900, color: 'white',
                    letterSpacing: '-0.04em', lineHeight: 1,
                    textShadow: '0 2px 24px rgba(0,0,0,.95)',
                  }}>
                    {primeiroNome}
                  </p>
                  {sobrenome && (
                    <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: '0.16em' }}>
                      {sobrenome}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      background: 'linear-gradient(135deg,rgba(251,191,36,.16),rgba(251,191,36,.07))',
                      border: '1px solid rgba(251,191,36,.3)', borderRadius: '7px',
                      padding: '4px 12px',
                      fontSize: '11px', fontWeight: 900, color: '#fbbf24', letterSpacing: '0.09em',
                    }}>
                      ⚡ Treinador
                    </div>
                    {treinador.cidade && (
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.38)', fontWeight: 600 }}>
                        · {treinador.cidade}
                      </span>
                    )}
                  </div>

                  {/* Stats dentro do card */}
                  {stats.av > 0 && (
                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        display: 'flex', alignItems: 'baseline', gap: '4px',
                        background: 'rgba(10,5,0,.8)',
                        border: '1px solid rgba(251,191,36,.2)', borderRadius: '8px',
                        padding: '4px 10px',
                      }}>
                        <span style={{ fontSize: '15px', fontWeight: 900, color: '#fbbf24', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{stats.av}</span>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>avaliações</span>
                      </div>
                      {stats.at > 0 && (
                        <div style={{
                          display: 'flex', alignItems: 'baseline', gap: '4px',
                          background: 'rgba(10,5,0,.8)',
                          border: '1px solid rgba(251,191,36,.2)', borderRadius: '8px',
                          padding: '4px 10px',
                        }}>
                          <span style={{ fontSize: '15px', fontWeight: 900, color: '#fbbf24', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{stats.at}</span>
                          <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>atletas</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Watermark */}
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right,transparent,rgba(255,255,255,.07))' }} />
                    <span style={{ fontSize: '7.5px', fontWeight: 800, letterSpacing: '0.22em', color: 'rgba(255,255,255,.13)', textTransform: 'uppercase' }}>Meu Craque</span>
                    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left,transparent,rgba(255,255,255,.07))' }} />
                  </div>
                </div>

              </div>{/* end card body */}
            </div>{/* end cardRef */}
          </div>
        </div>

        {/* TR- ID abaixo do card */}
        {treinador.treinadorId && (
          <div className="a4" style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 18px', borderRadius: '100px', marginBottom: '16px',
            background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.18)',
          }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,.25)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>ID</span>
            <span style={{ fontSize: '14px', fontWeight: 900, color: 'rgba(251,191,36,.7)', letterSpacing: '0.14em', fontVariantNumeric: 'tabular-nums' }}>
              {treinador.treinadorId?.replace(/^TR-/, '')}
            </span>
          </div>
        )}

        {/* Stats abaixo do card */}
        {(stats.av > 0 || stats.at > 0) && (
          <div className="a4" style={{
            display: 'flex', gap: '10px', marginBottom: '20px',
          }}>
            {[
              { val: stats.av,   label: 'avaliações' },
              { val: stats.at,   label: 'atletas'    },
              { val: stats.dest, label: 'destaques'  },
            ].filter(s => s.val > 0).map((s, i) => (
              <div key={i} style={{
                padding: '8px 16px', borderRadius: '100px',
                background: 'rgba(251,191,36,.07)', border: '1px solid rgba(251,191,36,.15)',
                fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,.5)',
              }}>
                <span style={{ fontWeight: 900, color: '#fbbf24' }}>{s.val}</span> {s.label}
              </div>
            ))}
          </div>
        )}

        {/* Frase */}
        <p className="a4" style={{ margin: '0 0 28px', fontSize: '13px', color: 'rgba(255,255,255,.27)', textAlign: 'center', lineHeight: 1.7 }}>
          Seu legado no futebol começa aqui.<br />
          <span style={{ color: 'rgba(251,191,36,.55)', fontWeight: 700 }}>Compartilhe com escolas, atletas e o mundo.</span>
        </p>

        {/* Ações */}
        <div className="a5" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button className="btn-primary" onClick={handleShare} disabled={shareStatus === 'sharing'} style={{ opacity: shareStatus === 'sharing' ? .7 : 1 }}>
            {shareStatus === 'sharing' ? '…' : '📲 Compartilhar meu card'}
          </button>
          <button className="btn-glass" onClick={handleDownload} disabled={downloading}>
            {downloading ? 'Baixando…' : '⬇ Baixar imagem'}
          </button>
          <button className="btn-ghost" onClick={handleCopy}>
            {copied ? '✓ Link copiado!' : '🔗 Copiar link'}
          </button>
        </div>

        <div style={{ width: '100%', marginTop: '28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,.04)' }} />
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,.13)', fontWeight: 600, letterSpacing: '.08em' }}>ou continue</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,.04)' }} />
        </div>

        <Link href="/treinador/dashboard" style={{ marginTop: '14px', display: 'block', width: '100%', textAlign: 'center', fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,.32)', textDecoration: 'none' }}>
          Voltar ao dashboard →
        </Link>

        <p style={{ marginTop: '28px', fontSize: '10px', color: 'rgba(255,255,255,.07)', textAlign: 'center' }}>
          ⚽ MEUCRAQUE.com · Construindo o futebol brasileiro.
        </p>
      </div>
    </main>
  )
}