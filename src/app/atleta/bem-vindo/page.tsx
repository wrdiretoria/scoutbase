'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function getAtributos(posicao: string) {
  const map: Record<string, { vel: number; vis: number; for: number; fin: number }> = {
    'Goleiro':          { vel: 58, vis: 72, for: 74, fin: 52 },
    'Lateral Direito':  { vel: 78, vis: 68, for: 65, fin: 58 },
    'Lateral Esquerdo': { vel: 78, vis: 68, for: 65, fin: 58 },
    'Zagueiro':         { vel: 62, vis: 70, for: 80, fin: 54 },
    'Volante':          { vel: 68, vis: 73, for: 72, fin: 60 },
    'Meia':             { vel: 70, vis: 80, for: 62, fin: 68 },
    'Meia-Atacante':    { vel: 73, vis: 78, for: 60, fin: 72 },
    'Ponta Direita':    { vel: 84, vis: 66, for: 58, fin: 70 },
    'Ponta Esquerda':   { vel: 84, vis: 66, for: 58, fin: 70 },
    'Atacante':         { vel: 76, vis: 65, for: 64, fin: 78 },
    'Centro-Avante':    { vel: 66, vis: 64, for: 76, fin: 82 },
  }
  return map[posicao] ?? { vel: 65, vis: 65, for: 65, fin: 65 }
}

function calcularOVR(posicao: string, temFoto: boolean): number {
  const a = getAtributos(posicao)
  const media = Math.round((a.vel + a.vis + a.for + a.fin) / 4)
  return Math.min(media + (temFoto ? 3 : 0), 82)
}

function getStatus(ovr: number): string {
  if (ovr >= 78) return 'Talento em destaque'
  if (ovr >= 72) return 'Atleta em ascensão'
  return 'Perfil em desenvolvimento'
}

// ── Animated counter ─────────────────────────────────────────────────────────

function useCounter(target: number, delay = 600, duration = 800) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now()
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1)
        const ease = 1 - Math.pow(1 - progress, 3)
        setValue(Math.round(ease * target))
        if (progress < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(timeout)
  }, [target, delay, duration])
  return value
}

// ── Atributo Bar ─────────────────────────────────────────────────────────────

function AtributoBar({ label, value, delay }: { label: string; value: number; delay: number }) {
  const [width, setWidth] = useState(0)
  const animVal = useCounter(value, delay, 700)

  useEffect(() => {
    const t = setTimeout(() => setWidth(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])

  const cor = value >= 75 ? '#00FF88' : value >= 65 ? '#4ade80' : 'rgba(255,255,255,0.5)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.10em', textTransform: 'uppercase' }}>
          {label}
        </span>
        <span style={{ fontSize: '14px', fontWeight: 900, color: cor }}>{animVal}</span>
      </div>
      <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: '2px',
          background: `linear-gradient(90deg, ${cor}, ${cor}aa)`,
          width: `${width}%`,
          transition: 'width 0.8s cubic-bezier(.22,1,.36,1)',
          boxShadow: `0 0 6px ${cor}66`,
        }} />
      </div>
    </div>
  )
}

// ── Main content ──────────────────────────────────────────────────────────────

function BemVindoContent() {
  const params    = useSearchParams()
  const nome      = params.get('nome')      ?? 'Atleta'
  const posicao   = params.get('posicao')   ?? ''
  const cidade    = params.get('cidade')    ?? ''
  const dataNasc  = params.get('dataNasc')  ?? ''
  const uid       = params.get('uid')       ?? ''
  const athleteId = params.get('athleteId') ?? ''
  const avatarUrl = params.get('avatarUrl') ?? ''

  const categoria  = dataNasc ? calcularCategoria(dataNasc) : ''
  const initials   = getInitials(nome)
  const posAbrev   = posLabel(posicao)
  const atributos  = getAtributos(posicao)
  const ovr        = calcularOVR(posicao, !!avatarUrl)
  const status     = getStatus(ovr)
  const ovrAnim    = useCounter(ovr, 700, 900)
  const cardUrl    = uid ? `https://meucraque.com.br/jogador/${uid}` : 'https://meucraque.com.br'

  const primeiroNome = nome.split(' ')[0]
  const sobrenome    = nome.split(' ').slice(1).join(' ')
  const idNumerico   = athleteId.replace('MC-', '')

  return (
    <main style={{
      background: '#040c07',
      minHeight: '100svh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '32px 20px 48px',
      fontFamily: 'system-ui, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>

      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes cardIn   { from{opacity:0;transform:translateY(36px) scale(0.93)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes glowIn   { from{opacity:0;filter:blur(40px)} to{opacity:1;filter:blur(80px)} }
        @keyframes pulseGlow {
          0%,100% { box-shadow: 0 0 40px rgba(0,255,136,0.15), 0 0 0 1px rgba(0,255,136,0.2) }
          50%     { box-shadow: 0 0 80px rgba(0,255,136,0.28), 0 0 0 1px rgba(0,255,136,0.35) }
        }
        @keyframes shimmerLine {
          0%   { transform: translateX(-100%) }
          100% { transform: translateX(300%) }
        }

        .anim-badge  { animation: fadeUp  .5s ease forwards .1s;  opacity:0 }
        .anim-card   { animation: cardIn  .7s cubic-bezier(.22,.68,0,1.1) forwards .2s; opacity:0 }
        .anim-attrs  { animation: fadeUp  .5s ease forwards .9s;  opacity:0 }
        .anim-status { animation: fadeUp  .5s ease forwards 1.0s; opacity:0 }
        .anim-id     { animation: fadeUp  .5s ease forwards 1.1s; opacity:0 }
        .anim-btns   { animation: fadeUp  .5s ease forwards 1.25s; opacity:0 }

        .card-glow { animation: pulseGlow 4s ease-in-out infinite 1.2s }

        .share-btn {
          width:100%; padding:16px; border-radius:14px; border:none;
          background: linear-gradient(135deg,#00FF88,#22c55e);
          color:#030805; font-weight:900; font-size:16px;
          cursor:pointer; font-family:system-ui,sans-serif;
          letter-spacing:0.04em;
          box-shadow: 0 0 32px rgba(0,255,136,0.3), 0 4px 16px rgba(0,0,0,0.4);
          transition: opacity .2s, transform .15s;
        }
        .share-btn:active { opacity:.88; transform:scale(0.98); }

        .ghost-btn {
          width:100%; padding:13px; border-radius:14px;
          border:1px solid rgba(255,255,255,0.1); background:transparent;
          color:rgba(255,255,255,0.5); font-size:14px; font-weight:600;
          cursor:pointer; font-family:system-ui,sans-serif; transition:border-color .2s;
        }
        .ghost-btn:hover { border-color:rgba(255,255,255,0.25); }
      `}</style>

      {/* ── Background glows ── */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }}>
        <div style={{ position:'absolute', top:'-10%', left:'50%', transform:'translateX(-50%)', width:'600px', height:'400px', borderRadius:'50%', background:'radial-gradient(ellipse,rgba(0,255,136,0.08) 0%,transparent 70%)', animation:'glowIn 1.2s ease forwards' }} />
        <div style={{ position:'absolute', bottom:'10%', left:'-20%', width:'400px', height:'400px', borderRadius:'50%', background:'radial-gradient(ellipse,rgba(0,255,136,0.05) 0%,transparent 70%)' }} />
      </div>

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:'360px', display:'flex', flexDirection:'column', alignItems:'center', gap:'20px' }}>

        {/* ── Badge topo ── */}
        <div className="anim-badge" style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#00FF88', boxShadow:'0 0 8px #00FF88' }} />
          <span style={{ fontSize:'11px', fontWeight:700, letterSpacing:'0.14em', color:'rgba(0,255,136,0.8)', textTransform:'uppercase' }}>
            Perfil criado
          </span>
          <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#00FF88', boxShadow:'0 0 8px #00FF88' }} />
        </div>

        {/* ══════════════════════════════════════
            CARD FIFA PREMIUM
        ══════════════════════════════════════ */}
        <div className="anim-card card-glow" style={{
          width: '260px',
          borderRadius: '22px',
          overflow: 'hidden',
          background: 'linear-gradient(160deg,#112218 0%,#0a1a10 45%,#060e08 100%)',
          position: 'relative',
        }}>

          {/* Linha de brilho animada no topo */}
          <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:'linear-gradient(90deg,transparent,rgba(0,255,136,0.8),transparent)', zIndex:10, overflow:'hidden' }}>
            <div style={{ width:'30%', height:'100%', background:'white', opacity:0.6, animation:'shimmerLine 3s ease-in-out infinite 1.5s' }} />
          </div>

          {/* ── FOTO / AVATAR ── */}
          <div style={{ position:'relative', height:'240px', overflow:'hidden' }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={nome} style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top' }} />
            ) : (
              <div style={{
                width:'100%', height:'100%',
                background:'linear-gradient(160deg,#1a3a26,#0d2218,#060e08)',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'12px',
              }}>
                {/* Silhueta premium */}
                <div style={{
                  width:'90px', height:'90px', borderRadius:'50%',
                  background:'linear-gradient(135deg,#15803d 0%,#4ade80 100%)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'28px', fontWeight:900, color:'white',
                  boxShadow:'0 0 40px rgba(0,255,136,0.5), 0 0 80px rgba(0,255,136,0.2)',
                }}>
                  {initials}
                </div>
              </div>
            )}

            {/* Overlay gradiente sobre a foto */}
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(6,14,8,1) 0%, rgba(6,14,8,0.4) 50%, rgba(6,14,8,0.1) 100%)' }} />

            {/* OVR — número grande */}
            <div style={{ position:'absolute', top:'14px', left:'14px', textAlign:'left' }}>
              <div style={{
                fontSize:'56px', fontWeight:900, lineHeight:1,
                color:'white',
                textShadow:'0 0 30px rgba(0,255,136,0.4), 0 4px 12px rgba(0,0,0,0.8)',
                letterSpacing:'-0.04em',
              }}>
                {ovrAnim}
              </div>
              <div style={{ fontSize:'10px', fontWeight:700, letterSpacing:'0.12em', color:'rgba(255,255,255,0.5)', textTransform:'uppercase', marginTop:'2px' }}>
                OVR
              </div>
            </div>

            {/* Categoria — top right */}
            {categoria && (
              <div style={{
                position:'absolute', top:'14px', right:'14px',
                background:'rgba(0,255,136,0.15)', backdropFilter:'blur(8px)',
                border:'1px solid rgba(0,255,136,0.4)',
                borderRadius:'8px', padding:'4px 10px',
                fontSize:'10px', fontWeight:800, color:'#00FF88', letterSpacing:'0.06em',
              }}>
                {categoria}
              </div>
            )}

            {/* Posição — bottom left */}
            <div style={{
              position:'absolute', bottom:'14px', left:'14px',
              background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)',
              border:'1px solid rgba(255,255,255,0.12)',
              borderRadius:'8px', padding:'4px 10px',
              fontSize:'11px', fontWeight:800, color:'white', letterSpacing:'0.08em',
            }}>
              {posAbrev}
            </div>
          </div>

          {/* ── INFO BOTTOM ── */}
          <div style={{ padding:'16px 18px 20px', textAlign:'center' }}>
            <p style={{ margin:'0 0 2px', fontSize:'20px', fontWeight:900, color:'white', letterSpacing:'-0.02em', lineHeight:1 }}>
              {primeiroNome}
            </p>
            {sobrenome && (
              <p style={{ margin:'0 0 4px', fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                {sobrenome}
              </p>
            )}
            {cidade && (
              <p style={{ margin:0, fontSize:'11px', color:'rgba(255,255,255,0.3)' }}>
                📍 {cidade}
              </p>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════
            ATRIBUTOS
        ══════════════════════════════════════ */}
        <div className="anim-attrs" style={{
          width:'100%',
          background:'rgba(255,255,255,0.03)',
          border:'1px solid rgba(255,255,255,0.07)',
          borderRadius:'18px',
          padding:'18px 20px',
          display:'flex', flexDirection:'column', gap:'14px',
        }}>
          <p style={{ margin:'0 0 4px', fontSize:'10px', fontWeight:700, letterSpacing:'0.12em', color:'rgba(255,255,255,0.25)', textTransform:'uppercase' }}>
            Atributos iniciais
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px 24px' }}>
            <AtributoBar label="Velocidade" value={atributos.vel} delay={1000} />
            <AtributoBar label="Visão"      value={atributos.vis} delay={1100} />
            <AtributoBar label="Força"      value={atributos.for} delay={1200} />
            <AtributoBar label="Finalização" value={atributos.fin} delay={1300} />
          </div>
          <p style={{ margin:0, fontSize:'10px', color:'rgba(255,255,255,0.18)', textAlign:'center' }}>
            Evoluem com avaliações reais
          </p>
        </div>

        {/* ── Status ── */}
        <div className="anim-status" style={{
          display:'flex', alignItems:'center', gap:'10px',
          padding:'12px 18px', borderRadius:'12px',
          background:'rgba(0,255,136,0.05)',
          border:'1px solid rgba(0,255,136,0.15)',
          width:'100%',
        }}>
          <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#00FF88', flexShrink:0, boxShadow:'0 0 8px #00FF88', animation:'pulseGlow 2s ease-in-out infinite' }} />
          <p style={{ margin:0, fontSize:'13px', fontWeight:700, color:'rgba(255,255,255,0.75)' }}>
            {status}
          </p>
        </div>

        {/* ── ID do atleta ── */}
        {athleteId && (
          <div className="anim-id" style={{ width:'100%', textAlign:'center' }}>
            <p style={{ margin:'0 0 6px', fontSize:'10px', fontWeight:700, letterSpacing:'0.14em', color:'rgba(255,255,255,0.3)', textTransform:'uppercase' }}>
              ID do atleta
            </p>
            <p style={{ margin:'0 0 4px', fontSize:'42px', fontWeight:900, color:'white', letterSpacing:'0.12em', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>
              {idNumerico}
            </p>
            <p style={{ margin:0, fontSize:'11px', color:'rgba(255,200,0,0.7)', fontWeight:600 }}>
              ⚠️ Guarde este número — é seu acesso ao sistema
            </p>
          </div>
        )}

        {/* ── Botões ── */}
        <div className="anim-btns" style={{ width:'100%', display:'flex', flexDirection:'column', gap:'10px' }}>
          <button
            className="share-btn"
            onClick={() => {
              const texto = `Acabei de criar meu perfil no MeuCraque! OVR ${ovr} · ${posicao} · ${cidade}. Você é o próximo? 🔥`
              if (navigator.share) {
                navigator.share({ title: `${nome} · MeuCraque`, text: texto, url: cardUrl })
              } else {
                navigator.clipboard.writeText(cardUrl)
                alert('Link copiado!')
              }
            }}
          >
            📲 Compartilhar meu card
          </button>

          <Link href="/atleta/perfil" style={{ textDecoration:'none' }}>
            <button className="ghost-btn">Ver meu perfil completo →</button>
          </Link>
        </div>

        <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.12)', textAlign:'center', marginTop:'4px' }}>
          ⚽ MEU <span style={{ color:'rgba(0,255,136,0.4)' }}>CRAQUE</span> · Você é o próximo.
        </p>
      </div>
    </main>
  )
}

export default function BemVindoPage() {
  return (
    <Suspense fallback={
      <main style={{ background:'#040c07', minHeight:'100svh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <p style={{ color:'rgba(255,255,255,0.3)', fontFamily:'system-ui' }}>Carregando…</p>
      </main>
    }>
      <BemVindoContent />
    </Suspense>
  )
}
