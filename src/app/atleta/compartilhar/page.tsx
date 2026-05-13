'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ── Helpers (espelhados do bem-vindo) ─────────────────────────────────────────

function calcularCategoria(dataNasc: string): string {
  const hoje = new Date()
  const nasc = new Date(dataNasc)
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  if (idade <= 11) return 'Sub-11'
  if (idade <= 13) return 'Sub-13'
  if (idade <= 15) return 'Sub-15'
  if (idade <= 17) return 'Sub-17'
  if (idade <= 20) return 'Sub-20'
  return 'Adulto'
}

function posLabel(pos: string): string {
  const map: Record<string, string> = {
    'Goleiro': 'GK', 'Lateral Direito': 'LD', 'Lateral Esquerdo': 'LE',
    'Zagueiro': 'ZG', 'Volante': 'VOL', 'Meia': 'MEI',
    'Meia-Atacante': 'MAT', 'Ponta Direita': 'PD', 'Ponta Esquerda': 'PE',
    'Atacante': 'ATA', 'Centro-Avante': 'CA',
  }
  return map[pos] ?? pos.slice(0, 3).toUpperCase()
}

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

function calcularOVRPerfil(temFoto: boolean): number {
  const base = 0.50
  const foto = temFoto ? 0.15 : 0
  return Math.round((base + foto) * 50)
}

// ── Animated counter ──────────────────────────────────────────────────────────

function useCounter(target: number, delay = 400, duration = 900) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now()
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1)
        setValue(Math.round((1 - Math.pow(1 - p, 3)) * target))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(timeout)
  }, [target, delay, duration])
  return value
}

// ── Share page ────────────────────────────────────────────────────────────────

function CompartilharContent() {
  const router     = useRouter()
  const params     = useSearchParams()
  const nome       = params.get('nome')      ?? 'Atleta'
  const posicao    = params.get('posicao')   ?? ''
  const cidade     = params.get('cidade')    ?? ''
  const dataNasc   = params.get('dataNasc')  ?? ''
  const uid        = params.get('uid')       ?? ''
  const athleteId  = params.get('athleteId') ?? ''
  const avatarUrl  = params.get('avatarUrl') ?? ''

  const categoria    = dataNasc ? calcularCategoria(dataNasc) : ''
  const initials     = getInitials(nome)
  const posAbrev     = posLabel(posicao)
  const ovrPerfil    = calcularOVRPerfil(!!avatarUrl)
  const ovr          = ovrPerfil
  const ovrAnim      = useCounter(ovr, 500, 900)
  const idNumerico   = athleteId.replace('MC-', '')
  const primeiroNome = nome.split(' ')[0]
  const sobrenome    = nome.split(' ').slice(1).join(' ')
  const cardUrl      = uid ? `https://meucraque.com.br/jogador/${uid}` : 'https://meucraque.com.br'

  const [copied,       setCopied]       = useState(false)
  const [downloading,  setDownloading]  = useState(false)
  const [shareStatus,  setShareStatus]  = useState<'idle'|'sharing'|'done'>('idle')

  // ── Ações ──────────────────────────────────────────────────────────────────

  async function handleShare() {
    setShareStatus('sharing')
    const texto = `🏆 ${nome} no MeuCraque\n${posicao}${cidade ? ` · ${cidade}` : ''}\nProgresso: ${ovr}/100\n\nVeja meu card oficial 👇\n${cardUrl}`
    try {
      if (navigator.share) {
        await navigator.share({ title: `${nome} · MeuCraque`, text: texto, url: cardUrl })
      } else {
        await navigator.clipboard.writeText(cardUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      }
    } catch { /* cancelado pelo usuário */ }
    setShareStatus('idle')
  }

  async function handleDownload() {
    if (!avatarUrl) {
      // Sem foto: compartilha o link
      handleShare()
      return
    }
    setDownloading(true)
    try {
      const res  = await fetch(avatarUrl)
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${nome.replace(/\s+/g, '_')}_MeuCraque.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // Fallback: abre a imagem num nova aba
      window.open(avatarUrl, '_blank')
    }
    setDownloading(false)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(cardUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      /* sem permissão */
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main style={{
      background: '#030a05',
      minHeight: '100svh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '28px 20px 52px',
      fontFamily: 'system-ui, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>

      <style>{`
        @keyframes fadeUp    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cardReveal {
          0%   { opacity:0; transform:translateY(48px) scale(0.90) }
          60%  { opacity:1; transform:translateY(-4px) scale(1.01) }
          100% { opacity:1; transform:translateY(0)   scale(1)    }
        }
        @keyframes glowBreath {
          0%,100% { opacity:0.6; transform:scale(1)    }
          50%     { opacity:1;   transform:scale(1.08) }
        }
        @keyframes shimmerLine {
          0%   { transform: translateX(-100%) }
          100% { transform: translateX(320%)  }
        }
        @keyframes shimmerCard {
          0%   { left: -50% }
          100% { left: 150% }
        }
        @keyframes pulseGlow {
          0%,100% { box-shadow: 0 0 40px rgba(0,255,136,0.12), 0 0 0 1px rgba(0,255,136,0.18), 0 32px 80px rgba(0,0,0,0.95) }
          50%     { box-shadow: 0 0 90px rgba(0,255,136,0.26), 0 0 0 1px rgba(0,255,136,0.35), 0 32px 80px rgba(0,0,0,0.95) }
        }
        @keyframes dotPulse {
          0%,100% { opacity:1;   transform:scale(1)   }
          50%     { opacity:0.5; transform:scale(0.7) }
        }

        .a-header  { animation: fadeUp     .5s ease forwards .05s; opacity:0 }
        .a-card    { animation: cardReveal .85s cubic-bezier(.22,.68,0,1.1) forwards .25s; opacity:0 }
        .a-phrase  { animation: fadeUp     .5s ease forwards  .9s; opacity:0 }
        .a-actions { animation: fadeUp     .5s ease forwards 1.05s; opacity:0 }

        .card-pulse { animation: pulseGlow 4.5s ease-in-out infinite 1.8s }

        .btn-share {
          width:100%; padding:17px; border-radius:15px; border:none;
          background: linear-gradient(135deg,#00e87a,#00FF88 55%,#22c55e);
          color:#020d04; font-weight:900; font-size:17px;
          cursor:pointer; font-family:system-ui,sans-serif;
          letter-spacing:0.04em;
          box-shadow: 0 0 48px rgba(0,255,136,0.4), 0 6px 24px rgba(0,0,0,0.5),
                      inset 0 1px 0 rgba(255,255,255,0.28);
          transition: opacity .2s, transform .15s;
        }
        .btn-share:active { opacity:.88; transform:scale(0.98); }

        .btn-glass {
          width:100%; padding:14px; border-radius:13px;
          border:1px solid rgba(255,255,255,0.12);
          background:rgba(255,255,255,0.04);
          color:rgba(255,255,255,0.65); font-size:15px; font-weight:700;
          cursor:pointer; font-family:system-ui,sans-serif;
          transition: border-color .2s, background .2s, color .2s;
          backdrop-filter: blur(8px);
        }
        .btn-glass:hover  { border-color:rgba(255,255,255,0.22); background:rgba(255,255,255,0.07); color:rgba(255,255,255,0.85); }
        .btn-glass:active { transform:scale(0.99); }

        .btn-ghost {
          width:100%; padding:13px; border-radius:13px;
          border:1px solid rgba(255,255,255,0.07); background:transparent;
          color:rgba(255,255,255,0.35); font-size:14px; font-weight:600;
          cursor:pointer; font-family:system-ui,sans-serif;
          transition: border-color .2s, color .2s;
        }
        .btn-ghost:hover { border-color:rgba(255,255,255,0.16); color:rgba(255,255,255,0.55); }
      `}</style>

      {/* ── Atmosphere — camadas de glow ── */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }}>
        <div style={{
          position:'absolute', top:'-20%', left:'50%', transform:'translateX(-50%)',
          width:'800px', height:'600px', borderRadius:'50%',
          background:'radial-gradient(ellipse,rgba(0,255,136,0.11) 0%,transparent 60%)',
          animation:'glowBreath 6s ease-in-out infinite',
        }} />
        <div style={{
          position:'absolute', bottom:'0%', right:'-25%',
          width:'600px', height:'600px', borderRadius:'50%',
          background:'radial-gradient(ellipse,rgba(0,255,136,0.05) 0%,transparent 65%)',
        }} />
        <div style={{
          position:'absolute', top:'40%', left:'-25%',
          width:'400px', height:'400px', borderRadius:'50%',
          background:'radial-gradient(ellipse,rgba(0,255,136,0.04) 0%,transparent 65%)',
        }} />
      </div>

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:'380px', display:'flex', flexDirection:'column', alignItems:'center', gap:'0' }}>

        {/* ── Header — voltar + logo ── */}
        <div className="a-header" style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'32px' }}>
          <button
            onClick={() => router.back()}
            style={{
              background:'none', border:'none', cursor:'pointer',
              color:'rgba(255,255,255,0.35)', fontSize:'13px', fontWeight:600,
              padding:0, display:'flex', alignItems:'center', gap:'5px',
              fontFamily:'system-ui, sans-serif',
            }}
          >
            ← Voltar
          </button>
          <Link href="/" style={{ fontSize:'14px', fontWeight:800, color:'white', textDecoration:'none', opacity:0.6 }}>
            ⚽ MEU <span style={{ color:'#22c55e' }}>CRAQUE</span>
          </Link>
          <div style={{ width:'60px' }} />
        </div>

        {/* ── Frase emocional — acima do card ── */}
        <div className="a-header" style={{ textAlign:'center', marginBottom:'28px' }}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:'7px',
            padding:'5px 14px', borderRadius:'100px', marginBottom:'14px',
            background:'rgba(0,255,136,0.08)', border:'1px solid rgba(0,255,136,0.2)',
          }}>
            <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#00FF88', boxShadow:'0 0 8px #00FF88', animation:'dotPulse 2s ease-in-out infinite' }} />
            <span style={{ fontSize:'10px', fontWeight:800, letterSpacing:'0.14em', color:'rgba(0,255,136,0.8)', textTransform:'uppercase' }}>
              Card oficial
            </span>
          </div>
          <h1 style={{
            margin: 0,
            fontSize:'clamp(32px,9vw,40px)',
            fontWeight: 900,
            color: 'white',
            letterSpacing: '-0.04em',
            lineHeight: 1.05,
            textShadow: '0 0 60px rgba(0,255,136,0.15)',
          }}>
            Minha jornada<br />
            <span style={{ color:'#00FF88', textShadow:'0 0 40px rgba(0,255,136,0.5)' }}>começou.</span>
          </h1>
        </div>

        {/* ══════════════════════════════════════
            CARD — foco total, glow envolvente
        ══════════════════════════════════════ */}
        <div className="a-card" style={{ width:'100%', display:'flex', justifyContent:'center', marginBottom:'28px' }}>

          {/* Glow próprio atrás do card */}
          <div style={{ position:'relative' }}>
            <div style={{
              position:'absolute', inset:'-30px', zIndex:0, borderRadius:'60px',
              background:'radial-gradient(ellipse,rgba(0,255,136,0.18) 0%,transparent 65%)',
              filter:'blur(20px)',
            }} />

            {/* Wrapper para corner accents */}
            <div style={{ position:'relative', width:'min(300px,88vw)', zIndex:1 }}>

              {/* Corner accents */}
              <div style={{ position:'absolute', top:-1, left:-1, width:'22px', height:'22px', zIndex:20, pointerEvents:'none', borderTop:'1.5px solid rgba(0,255,136,0.7)', borderLeft:'1.5px solid rgba(0,255,136,0.7)', borderTopLeftRadius:'28px' }} />
              <div style={{ position:'absolute', top:-1, right:-1, width:'22px', height:'22px', zIndex:20, pointerEvents:'none', borderTop:'1.5px solid rgba(0,255,136,0.7)', borderRight:'1.5px solid rgba(0,255,136,0.7)', borderTopRightRadius:'28px' }} />
              <div style={{ position:'absolute', bottom:-1, left:-1, width:'22px', height:'22px', zIndex:20, pointerEvents:'none', borderBottom:'1.5px solid rgba(0,255,136,0.4)', borderLeft:'1.5px solid rgba(0,255,136,0.4)', borderBottomLeftRadius:'28px' }} />
              <div style={{ position:'absolute', bottom:-1, right:-1, width:'22px', height:'22px', zIndex:20, pointerEvents:'none', borderBottom:'1.5px solid rgba(0,255,136,0.4)', borderRight:'1.5px solid rgba(0,255,136,0.4)', borderBottomRightRadius:'28px' }} />

              {/* O card */}
              <div className="card-pulse" style={{
                width: '100%',
                borderRadius: '28px',
                overflow: 'hidden',
                position: 'relative',
                background: 'linear-gradient(170deg,#122018 0%,#0a1912 35%,#050e08 100%)',
                boxShadow: [
                  '0 0 0 1px rgba(0,255,136,0.22)',
                  '0 0 0 2px rgba(0,0,0,0.9)',
                  '0 36px 80px rgba(0,0,0,0.98)',
                  '0 0 100px rgba(0,255,136,0.09)',
                ].join(','),
              }}>

                {/* Textura sutil */}
                <div style={{
                  position:'absolute', inset:0, zIndex:0, opacity:0.025,
                  backgroundImage:'radial-gradient(rgba(255,255,255,1) 1px,transparent 1px)',
                  backgroundSize:'18px 18px',
                }} />

                {/* Reflexo interno diagonal */}
                <div style={{
                  position:'absolute', inset:0, zIndex:1, pointerEvents:'none',
                  background:'linear-gradient(135deg,rgba(255,255,255,0.04) 0%,transparent 45%,transparent 55%,rgba(0,0,0,0.15) 100%)',
                }} />

                {/* Shimmer line topo */}
                <div style={{
                  position:'absolute', top:0, left:0, right:0, height:'1px', zIndex:15,
                  background:'linear-gradient(90deg,transparent,rgba(0,255,136,0.85),transparent)',
                  overflow:'hidden',
                }}>
                  <div style={{
                    position:'absolute', top:0, bottom:0, width:'40%',
                    background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.9),transparent)',
                    animation:'shimmerLine 3.2s ease-in-out infinite 2.2s',
                  }} />
                </div>

                {/* Sheen sweep único */}
                <div style={{ position:'absolute', inset:0, zIndex:6, pointerEvents:'none', overflow:'hidden' }}>
                  <div style={{
                    position:'absolute', top:'-20%', bottom:'-20%', width:'45%',
                    background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.055),transparent)',
                    transform:'skewX(-12deg)', left:'-50%',
                    animation:'shimmerCard 1s cubic-bezier(.4,0,.2,1) forwards 1.6s',
                  }} />
                </div>

                {/* ── Área da foto ── */}
                <div style={{ position:'relative', height:'280px', overflow:'hidden', zIndex:2 }}>

                  {avatarUrl ? (
                    <img
                      src={avatarUrl} alt={nome}
                      style={{
                        width:'100%', height:'100%',
                        objectFit:'cover', objectPosition:'center 18%',
                        display:'block',
                        filter:'contrast(1.07) saturate(1.1) brightness(0.95)',
                      }}
                    />
                  ) : (
                    <div style={{
                      width:'100%', height:'100%',
                      background:'linear-gradient(160deg,#1a3828 0%,#0e2018 50%,#040c07 100%)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      position:'relative',
                    }}>
                      <div style={{
                        position:'absolute', inset:0,
                        background:'radial-gradient(ellipse 70% 55% at 50% 42%,rgba(0,255,136,0.14) 0%,transparent 70%)',
                      }} />
                      <div style={{
                        position:'relative', zIndex:1,
                        width:'110px', height:'110px', borderRadius:'50%',
                        background:'linear-gradient(145deg,#1a7a42,#22c55e,#4ade80)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:'36px', fontWeight:900, color:'white',
                        letterSpacing:'-0.02em',
                        boxShadow:'0 0 0 1px rgba(0,255,136,0.3), 0 0 60px rgba(0,255,136,0.5), 0 0 120px rgba(0,255,136,0.18), inset 0 1px 0 rgba(255,255,255,0.2)',
                      }}>
                        {initials}
                      </div>
                    </div>
                  )}

                  {/* Overlays cinematográficos */}
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(5,14,8,1) 0%,rgba(5,14,8,0.88) 22%,rgba(5,14,8,0.45) 48%,rgba(5,14,8,0.08) 72%,transparent 100%)' }} />
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right,rgba(5,14,8,0.55) 0%,transparent 28%,transparent 72%,rgba(5,14,8,0.4) 100%)' }} />
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(0,0,0,0.32) 0%,transparent 28%)' }} />
                  {avatarUrl && (
                    <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 100% 70% at 50% 0%,rgba(0,255,136,0.05) 0%,transparent 65%)', mixBlendMode:'screen' as const }} />
                  )}

                  {/* Categoria */}
                  {categoria && (
                    <div style={{
                      position:'absolute', top:'14px', right:'14px', zIndex:8,
                      background:'rgba(0,0,0,0.65)', backdropFilter:'blur(20px)',
                      WebkitBackdropFilter:'blur(20px)',
                      border:'1px solid rgba(0,255,136,0.42)', borderRadius:'10px',
                      padding:'5px 12px', fontSize:'10px', fontWeight:800, color:'#00FF88',
                      letterSpacing:'0.10em',
                      boxShadow:'0 0 16px rgba(0,255,136,0.2),inset 0 1px 0 rgba(255,255,255,0.08)',
                      textShadow:'0 0 12px rgba(0,255,136,0.6)',
                    }}>
                      {categoria}
                    </div>
                  )}

                  {/* Nome */}
                  <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:8, padding:'0 18px 18px' }}>
                    <p style={{
                      margin:'0 0 3px',
                      fontSize:'32px', fontWeight:900, color:'white',
                      letterSpacing:'-0.04em', lineHeight:1,
                      textShadow:'0 2px 24px rgba(0,0,0,0.95),0 0 48px rgba(0,255,136,0.12)',
                    }}>
                      {primeiroNome}
                    </p>
                    {sobrenome && (
                      <p style={{
                        margin:0, fontSize:'11px', fontWeight:700,
                        color:'rgba(255,255,255,0.52)',
                        textTransform:'uppercase', letterSpacing:'0.16em',
                        textShadow:'0 1px 10px rgba(0,0,0,0.95)',
                      }}>
                        {sobrenome}
                      </p>
                    )}
                  </div>
                </div>

                {/* ── Faixa inferior ── */}
                <div style={{ position:'relative', zIndex:2, padding:'14px 18px 18px' }}>

                  {/* Divisor */}
                  <div style={{
                    height:'1px',
                    background:'linear-gradient(90deg,transparent,rgba(0,255,136,0.55),transparent)',
                    marginBottom:'13px', boxShadow:'0 0 10px rgba(0,255,136,0.2)',
                  }} />

                  {/* Posição + Cidade */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{
                      display:'inline-flex', alignItems:'center',
                      background:'linear-gradient(135deg,rgba(0,255,136,0.14),rgba(0,255,136,0.07))',
                      border:'1px solid rgba(0,255,136,0.28)', borderRadius:'8px', padding:'5px 13px',
                      boxShadow:'0 0 14px rgba(0,255,136,0.1),inset 0 1px 0 rgba(255,255,255,0.07)',
                    }}>
                      <span style={{ fontSize:'12px', fontWeight:900, color:'#00FF88', letterSpacing:'0.10em' }}>{posAbrev}</span>
                    </div>
                    {cidade && (
                      <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.32)', fontWeight:600, letterSpacing:'0.02em' }}>
                        · {cidade}
                      </span>
                    )}
                  </div>

                  {/* Progresso */}
                  <div style={{ marginTop:'14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontSize:'9px', fontWeight:800, letterSpacing:'0.16em', color:'rgba(255,255,255,0.25)', textTransform:'uppercase' }}>
                      Progresso do perfil
                    </span>
                    <span style={{ fontSize:'14px', fontWeight:900, color:'#00FF88', fontVariantNumeric:'tabular-nums', textShadow:'0 0 14px rgba(0,255,136,0.55)' }}>
                      {ovrAnim}<span style={{ fontSize:'9px', fontWeight:700, color:'rgba(255,255,255,0.2)', marginLeft:'2px' }}>/100</span>
                    </span>
                  </div>

                  {/* Barras */}
                  <div style={{ marginTop:'9px', display:'flex', flexDirection:'column', gap:'8px' }}>
                    <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <span style={{ fontSize:'9px', fontWeight:700, letterSpacing:'0.10em', color:'rgba(255,255,255,0.4)', textTransform:'uppercase' }}>Perfil</span>
                        <span style={{ fontSize:'10px', fontWeight:900, color:'#00FF88', fontVariantNumeric:'tabular-nums' }}>{ovrPerfil}/50</span>
                      </div>
                      <div style={{ height:'4px', background:'rgba(255,255,255,0.06)', borderRadius:'4px', overflow:'hidden' }}>
                        <div style={{ height:'100%', borderRadius:'4px', background:'linear-gradient(90deg,#00c864,#00FF88)', width:`${(ovrPerfil/50)*100}%`, transition:'width 1.2s cubic-bezier(.22,1,.36,1)', boxShadow:'0 0 8px rgba(0,255,136,0.6)' }} />
                      </div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <span style={{ fontSize:'9px', fontWeight:700, letterSpacing:'0.10em', color:'rgba(255,255,255,0.18)', textTransform:'uppercase' }}>Avaliação</span>
                        <span style={{ fontSize:'10px', fontWeight:900, color:'rgba(255,255,255,0.18)', fontVariantNumeric:'tabular-nums' }}>0/50</span>
                      </div>
                      <div style={{ height:'4px', background:'rgba(255,255,255,0.05)', borderRadius:'4px' }} />
                    </div>
                  </div>

                  {/* Watermark */}
                  <div style={{ marginTop:'14px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                    <div style={{ flex:1, height:'1px', background:'linear-gradient(to right,transparent,rgba(255,255,255,0.07))' }} />
                    <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                      <div style={{ width:'3px', height:'3px', borderRadius:'50%', background:'rgba(0,255,136,0.35)' }} />
                      <span style={{ fontSize:'8px', fontWeight:800, letterSpacing:'0.22em', color:'rgba(255,255,255,0.15)', textTransform:'uppercase' }}>MEU CRAQUE</span>
                      <div style={{ width:'3px', height:'3px', borderRadius:'50%', background:'rgba(0,255,136,0.35)' }} />
                    </div>
                    <div style={{ flex:1, height:'1px', background:'linear-gradient(to left,transparent,rgba(255,255,255,0.07))' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Frase de apoio abaixo do card ── */}
        <p className="a-phrase" style={{
          margin:'0 0 28px',
          fontSize:'13px', color:'rgba(255,255,255,0.28)',
          textAlign:'center', lineHeight:1.7, letterSpacing:'0.01em',
        }}>
          Pronto para o mundo ver.<br />
          <span style={{ color:'rgba(0,255,136,0.5)', fontWeight:700 }}>Compartilhe com treinadores, amigos e clubes.</span>
        </p>

        {/* ── Ações ── */}
        <div className="a-actions" style={{ width:'100%', display:'flex', flexDirection:'column', gap:'10px' }}>

          {/* CTA principal — compartilhar */}
          <button
            className="btn-share"
            onClick={handleShare}
            disabled={shareStatus === 'sharing'}
            style={{ opacity: shareStatus === 'sharing' ? 0.7 : 1 }}
          >
            {shareStatus === 'sharing' ? '…' : '📲 Compartilhar agora'}
          </button>

          {/* Baixar */}
          <button
            className="btn-glass"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? 'Baixando…' : '⬇ Baixar imagem'}
          </button>

          {/* Copiar link */}
          <button
            className="btn-ghost"
            onClick={handleCopy}
          >
            {copied
              ? '✓ Link copiado!'
              : '🔗 Copiar link do perfil'}
          </button>
        </div>

        {/* ── Separador ── */}
        <div style={{ width:'100%', marginTop:'28px', display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.05)' }} />
          <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.15)', fontWeight:600, letterSpacing:'0.08em' }}>
            ou continue
          </span>
          <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.05)' }} />
        </div>

        {/* ── Link para o perfil ── */}
        <Link
          href="/atleta/perfil"
          style={{
            marginTop:'14px',
            display:'block', width:'100%', textAlign:'center',
            fontSize:'14px', fontWeight:700,
            color:'rgba(255,255,255,0.38)', textDecoration:'none',
            letterSpacing:'0.01em',
            transition:'color .2s',
          }}
        >
          Ver perfil completo →
        </Link>

        <p style={{ marginTop:'28px', fontSize:'10px', color:'rgba(255,255,255,0.1)', textAlign:'center' }}>
          ⚽ MEU <span style={{ color:'rgba(0,255,136,0.3)' }}>CRAQUE</span> · Você é o próximo.
        </p>
      </div>
    </main>
  )
}

export default function CompartilharPage() {
  return (
    <Suspense fallback={
      <main style={{ background:'#030a05', minHeight:'100svh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <p style={{ color:'rgba(255,255,255,0.3)', fontFamily:'system-ui' }}>Carregando…</p>
      </main>
    }>
      <CompartilharContent />
    </Suspense>
  )
}
