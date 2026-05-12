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

/**
 * OVR = Perfil (0–50) + Avaliação (0–50)
 *
 * Pesos de preenchimento do perfil (soma = 100%):
 *   nome       15%  | posicao  15%  | cidade    10%
 *   dataNasc   10%  | foto     15%  | bio       15%
 *   fisico     10%  | clube    10%
 *
 * No pós-cadastro o atleta tem: nome + posicao + cidade + dataNasc (50%)
 * Com foto: +15% → 65%
 * OVR inicial = completude% × 0.5  (escala 0–50)
 */
function calcularOVRPerfil(temFoto: boolean): number {
  const base = 0.50          // nome + posicao + cidade + dataNasc
  const foto = temFoto ? 0.15 : 0
  const completude = base + foto   // 0.50 ou 0.65
  return Math.round(completude * 50)
}

function getStatus(ovrPerfil: number): string {
  if (ovrPerfil >= 30) return 'Perfil em destaque'
  if (ovrPerfil >= 25) return 'Atleta em evolução'
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
  const ovrPerfil  = calcularOVRPerfil(!!avatarUrl)
  const ovr        = ovrPerfil   // total = perfil + avaliação; avaliação=0 agora
  const status     = getStatus(ovrPerfil)
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
        <div className="anim-card" style={{ width:'100%', display:'flex', justifyContent:'center' }}>
          <div className="card-glow" style={{
            width: '300px',
            borderRadius: '24px',
            overflow: 'hidden',
            position: 'relative',
            background: 'linear-gradient(175deg,#0f2018 0%,#091510 40%,#040c07 100%)',
            boxShadow: '0 0 0 1px rgba(0,255,136,0.18), 0 40px 80px rgba(0,0,0,0.9), 0 0 60px rgba(0,255,136,0.1)',
          }}>

            {/* ── Textura de grade esportiva sutil ── */}
            <div style={{
              position:'absolute', inset:0, zIndex:0, opacity:0.04,
              backgroundImage:'repeating-linear-gradient(0deg,rgba(255,255,255,1) 0px,rgba(255,255,255,1) 1px,transparent 1px,transparent 32px), repeating-linear-gradient(90deg,rgba(255,255,255,1) 0px,rgba(255,255,255,1) 1px,transparent 1px,transparent 32px)',
            }} />

            {/* ── Linha de brilho topo ── */}
            <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', zIndex:10, background:'linear-gradient(90deg,transparent 0%,rgba(0,255,136,0.9) 50%,transparent 100%)', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, width:'40%', height:'100%', background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.9),transparent)', animation:'shimmerLine 2.8s ease-in-out infinite 1.8s' }} />
            </div>

            {/* ── ÁREA DA FOTO — heroica ── */}
            <div style={{ position:'relative', height:'300px', overflow:'hidden', zIndex:1 }}>

              {avatarUrl ? (
                <img
                  src={avatarUrl} alt={nome}
                  style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 15%', display:'block' }}
                />
              ) : (
                /* Sem foto: fundo premium com iniciais */
                <div style={{
                  width:'100%', height:'100%',
                  background:'linear-gradient(160deg,#183024 0%,#0d2018 55%,#040c07 100%)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <div style={{
                    width:'110px', height:'110px', borderRadius:'50%',
                    background:'linear-gradient(145deg,#166534,#4ade80)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'36px', fontWeight:900, color:'white',
                    boxShadow:'0 0 60px rgba(0,255,136,0.55), 0 0 120px rgba(0,255,136,0.2)',
                    letterSpacing:'-0.02em',
                  }}>
                    {initials}
                  </div>
                </div>
              )}

              {/* Overlay: gradiente cinematográfico */}
              <div style={{
                position:'absolute', inset:0,
                background:'linear-gradient(to top, rgba(4,12,7,1) 0%, rgba(4,12,7,0.7) 30%, rgba(4,12,7,0.1) 60%, transparent 100%)',
              }} />
              {/* Overlay lateral esquerdo sutil */}
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(4,12,7,0.4) 0%, transparent 50%)' }} />

              {/* OVR removido da foto — exibido na faixa inferior como progresso de perfil */}

              {/* ── Categoria — top right ── */}
              {categoria && (
                <div style={{
                  position:'absolute', top:'18px', right:'18px', zIndex:3,
                  background:'rgba(0,0,0,0.5)', backdropFilter:'blur(12px)',
                  border:'1px solid rgba(0,255,136,0.35)',
                  borderRadius:'10px', padding:'5px 12px',
                  fontSize:'10px', fontWeight:800, color:'#00FF88',
                  letterSpacing:'0.08em', textShadow:'0 0 10px rgba(0,255,136,0.5)',
                }}>
                  {categoria}
                </div>
              )}

              {/* ── Nome sobre a foto (bottom) ── */}
              <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:3, padding:'0 20px 20px' }}>
                <p style={{
                  margin:'0 0 1px',
                  fontSize:'28px', fontWeight:900, color:'white',
                  letterSpacing:'-0.03em', lineHeight:1,
                  textShadow:'0 2px 12px rgba(0,0,0,0.8)',
                }}>
                  {primeiroNome}
                </p>
                {sobrenome && (
                  <p style={{
                    margin:0, fontSize:'13px', fontWeight:700,
                    color:'rgba(255,255,255,0.45)',
                    textTransform:'uppercase', letterSpacing:'0.1em',
                    textShadow:'0 1px 8px rgba(0,0,0,0.8)',
                  }}>
                    {sobrenome}
                  </p>
                )}
              </div>
            </div>

            {/* ── FAIXA INFERIOR ── */}
            <div style={{ position:'relative', zIndex:1, padding:'16px 20px 20px' }}>

              {/* Linha divisória com glow */}
              <div style={{ height:'1px', background:'linear-gradient(90deg,transparent,rgba(0,255,136,0.3),transparent)', marginBottom:'14px' }} />

              {/* Posição + Cidade */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{
                  display:'inline-flex', alignItems:'center', gap:'6px',
                  background:'rgba(0,255,136,0.08)',
                  border:'1px solid rgba(0,255,136,0.2)',
                  borderRadius:'8px', padding:'5px 12px',
                }}>
                  <span style={{ fontSize:'12px', fontWeight:900, color:'#00FF88', letterSpacing:'0.08em' }}>{posAbrev}</span>
                </div>

                {cidade && (
                  <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)', fontWeight:500 }}>
                    📍 {cidade}
                  </span>
                )}
              </div>

              {/* ── Progresso do perfil — cabeçalho + OVR total ── */}
              <div style={{ marginTop:'14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{
                  fontSize:'9px', fontWeight:800, letterSpacing:'0.14em',
                  color:'rgba(255,255,255,0.3)', textTransform:'uppercase',
                }}>
                  Progresso do perfil
                </span>
                <span style={{
                  fontSize:'13px', fontWeight:900,
                  color:'#00FF88', fontVariantNumeric:'tabular-nums',
                  textShadow:'0 0 10px rgba(0,255,136,0.4)',
                }}>
                  {ovrAnim}<span style={{ fontSize:'9px', fontWeight:700, color:'rgba(255,255,255,0.25)', marginLeft:'2px' }}>/100</span>
                </span>
              </div>

              {/* ── OVR Breakdown bars ── */}
              <div style={{ marginTop:'8px', display:'flex', flexDirection:'column', gap:'8px' }}>
                {/* Perfil */}
                <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'9px', fontWeight:700, letterSpacing:'0.10em', color:'rgba(255,255,255,0.35)', textTransform:'uppercase' }}>
                      Perfil
                    </span>
                    <span style={{ fontSize:'10px', fontWeight:900, color:'#00FF88', fontVariantNumeric:'tabular-nums' }}>
                      {ovrPerfil}/50
                    </span>
                  </div>
                  <div style={{ height:'3px', background:'rgba(255,255,255,0.08)', borderRadius:'2px', overflow:'hidden' }}>
                    <div style={{
                      height:'100%', borderRadius:'2px',
                      background:'linear-gradient(90deg,#00FF88,#22c55e)',
                      width:`${(ovrPerfil / 50) * 100}%`,
                      transition:'width 1s cubic-bezier(.22,1,.36,1)',
                      boxShadow:'0 0 6px rgba(0,255,136,0.5)',
                    }} />
                  </div>
                </div>
                {/* Avaliação */}
                <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'9px', fontWeight:700, letterSpacing:'0.10em', color:'rgba(255,255,255,0.2)', textTransform:'uppercase' }}>
                      Avaliação
                    </span>
                    <span style={{ fontSize:'10px', fontWeight:900, color:'rgba(255,255,255,0.2)', fontVariantNumeric:'tabular-nums' }}>
                      0/50
                    </span>
                  </div>
                  <div style={{ height:'3px', background:'rgba(255,255,255,0.08)', borderRadius:'2px', overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:'2px', background:'rgba(255,255,255,0.12)', width:'0%' }} />
                  </div>
                </div>
              </div>

              {/* Linha inferior com logo */}
              <div style={{ marginTop:'14px', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.06)' }} />
                <span style={{ fontSize:'9px', fontWeight:800, letterSpacing:'0.16em', color:'rgba(255,255,255,0.18)', textTransform:'uppercase' }}>
                  MEU CRAQUE
                </span>
                <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.06)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════
            ATRIBUTOS — BLOQUEADO
        ══════════════════════════════════════ */}
        <div className="anim-attrs" style={{
          width:'100%',
          background:'rgba(255,255,255,0.02)',
          border:'1px solid rgba(255,255,255,0.07)',
          borderRadius:'18px',
          padding:'20px',
          display:'flex', flexDirection:'column', gap:'16px',
          position:'relative', overflow:'hidden',
        }}>
          {/* Blur overlay premium */}
          <div style={{
            position:'absolute', inset:0, zIndex:2,
            backdropFilter:'blur(3px)',
            background:'rgba(4,12,7,0.55)',
            borderRadius:'18px',
            display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center',
            gap:'10px', padding:'20px', textAlign:'center',
          }}>
            <div style={{
              width:'44px', height:'44px', borderRadius:'50%',
              background:'rgba(255,255,255,0.05)',
              border:'1px solid rgba(255,255,255,0.1)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'20px',
            }}>🔒</div>
            <p style={{ margin:0, fontSize:'13px', fontWeight:800, color:'rgba(255,255,255,0.75)', letterSpacing:'0.01em' }}>
              Atributos técnicos
            </p>
            <p style={{ margin:0, fontSize:'11px', color:'rgba(255,255,255,0.35)', lineHeight:1.6, maxWidth:'220px' }}>
              Disponíveis após avaliação oficial de um treinador certificado
            </p>
          </div>

          {/* Conteúdo fantasma por baixo */}
          <p style={{ margin:0, fontSize:'10px', fontWeight:700, letterSpacing:'0.12em', color:'rgba(255,255,255,0.15)', textTransform:'uppercase' }}>
            Atributos técnicos
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px 24px', opacity:0.2 }}>
            {['Velocidade','Visão','Força','Finalização'].map(label => (
              <div key={label} style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:'10px', fontWeight:700, color:'rgba(255,255,255,0.4)', letterSpacing:'0.10em', textTransform:'uppercase' }}>{label}</span>
                  <span style={{ fontSize:'14px', fontWeight:900, color:'rgba(255,255,255,0.3)' }}>??</span>
                </div>
                <div style={{ height:'3px', background:'rgba(255,255,255,0.08)', borderRadius:'2px' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Microcopy emocional */}
        <p className="anim-status" style={{
          margin:0, fontSize:'12px', color:'rgba(255,255,255,0.3)',
          textAlign:'center', lineHeight:1.6,
        }}>
          Receba sua primeira avaliação oficial<br />e desbloqueie seus atributos técnicos.
        </p>

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
