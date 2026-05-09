'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'

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

function calcularOVR(nome: string): number {
  const hash = nome.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return 68 + (hash % 13)
}

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
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

function BemVindoContent() {
  const params   = useSearchParams()
  const nome     = params.get('nome')     ?? 'Atleta'
  const posicao  = params.get('posicao')  ?? ''
  const cidade   = params.get('cidade')   ?? ''
  const dataNasc = params.get('dataNasc') ?? ''
  const uid      = params.get('uid')      ?? ''

  const ovr      = calcularOVR(nome)
  const categoria = dataNasc ? calcularCategoria(dataNasc) : ''
  const initials  = getInitials(nome)
  const posAbrev  = posLabel(posicao)
  const cardUrl   = uid
    ? `https://scoutbase-eta.vercel.app/jogador/${uid}`
    : 'https://scoutbase-eta.vercel.app'

  return (
    <main style={{
      background: '#06100a', minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'system-ui, sans-serif',
    }}>
      <style>{`
        @keyframes cardReveal {
          from { opacity:0; transform:translateY(36px) scale(0.96) }
          to   { opacity:1; transform:translateY(0)    scale(1) }
        }
        @keyframes ovrPop {
          0%   { opacity:0; transform:scale(0.6) }
          65%  { transform:scale(1.06) }
          100% { opacity:1; transform:scale(1) }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(10px) }
          to   { opacity:1; transform:translateY(0) }
        }
        @keyframes glowPulse {
          0%,100% { text-shadow: 0 0 24px rgba(34,197,94,0.55), 0 0 48px rgba(34,197,94,0.25) }
          50%     { text-shadow: 0 0 36px rgba(34,197,94,0.80), 0 0 72px rgba(34,197,94,0.40) }
        }

        .card-wrap  { animation: cardReveal 0.55s cubic-bezier(.22,.68,0,1.2) forwards; }
        .ovr-num    { animation: ovrPop 0.5s cubic-bezier(.22,.68,0,1.2) forwards 0.35s, glowPulse 3s ease-in-out infinite 1s; opacity:0; }
        .name-row   { animation: fadeUp 0.5s ease forwards 0.55s; opacity:0; }
        .actions    { animation: fadeUp 0.5s ease forwards 0.72s; opacity:0; }

        .share-btn {
          width:100%; padding:14px; border-radius:14px; border:none;
          background:#22c55e; color:black; font-weight:800; font-size:15px;
          cursor:pointer; font-family:system-ui,sans-serif; transition:opacity .2s;
        }
        .share-btn:hover { opacity:.88; }
        .ghost-btn {
          width:100%; padding:12px; border-radius:14px;
          border:1px solid rgba(255,255,255,0.10); background:transparent;
          color:rgba(255,255,255,0.45); font-size:14px;
          cursor:pointer; font-family:system-ui,sans-serif; transition:border-color .2s;
        }
        .ghost-btn:hover { border-color:rgba(255,255,255,0.25); }
      `}</style>

      {/* Headline emocional */}
      <div className="name-row" style={{ textAlign:'center', marginBottom:'28px' }}>
        <p style={{ margin:'0 0 6px', fontSize:'12px', fontWeight:700, letterSpacing:'0.12em', color:'#22c55e', textTransform:'uppercase' }}>
          ⚡ perfil criado
        </p>
        <h1 style={{ margin:0, fontSize:'27px', fontWeight:900, color:'white', letterSpacing:'-0.02em', lineHeight:1.2 }}>
          Hoje você entrou no jogo,<br />
          <em style={{ color:'#22c55e', fontStyle:'normal' }}>{nome.split(' ')[0]}.</em>
        </h1>
      </div>

      {/* Card */}
      <div className="card-wrap" style={{ width:'100%', maxWidth:'320px', marginBottom:'20px' }}>
        <div style={{
          borderRadius:'22px', overflow:'hidden',
          background:'#0b1610',
          border:'1px solid rgba(34,197,94,0.22)',
          boxShadow:'0 0 56px rgba(34,197,94,0.18), 0 24px 64px rgba(0,0,0,0.65)',
        }}>

          {/* ── TOPO ── */}
          <div style={{
            position:'relative', minHeight:'156px',
            background:'linear-gradient(160deg,#166534 0%,#052e16 100%)',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            padding:'20px 16px 0',
            // Grid tático sutil
            backgroundImage:'linear-gradient(160deg,#166534 0%,#052e16 100%), repeating-linear-gradient(0deg,rgba(255,255,255,0.025) 0px,rgba(255,255,255,0.025) 1px,transparent 1px,transparent 28px), repeating-linear-gradient(90deg,rgba(255,255,255,0.025) 0px,rgba(255,255,255,0.025) 1px,transparent 1px,transparent 28px)',
          }}>

            {/* Badge posição — esquerda */}
            {posicao && (
              <div style={{
                position:'absolute', top:'14px', left:'14px',
                background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)',
                border:'1px solid rgba(255,255,255,0.15)',
                borderRadius:'8px', padding:'4px 10px',
                fontSize:'10px', fontWeight:800, color:'white', letterSpacing:'0.08em',
              }}>
                {posAbrev}
              </div>
            )}

            {/* Badge categoria — direita */}
            {categoria && (
              <div style={{
                position:'absolute', top:'14px', right:'14px',
                background:'rgba(34,197,94,0.18)', border:'1px solid rgba(34,197,94,0.35)',
                borderRadius:'8px', padding:'4px 10px',
                fontSize:'10px', fontWeight:800, color:'#4ade80', letterSpacing:'0.06em',
              }}>
                {categoria}
              </div>
            )}

            {/* OVR — número grande com glow */}
            <div style={{ textAlign:'center', marginTop:'12px' }}>
              <div className="ovr-num" style={{
                fontSize:'76px', fontWeight:900, color:'white', lineHeight:1,
                letterSpacing:'-0.05em',
              }}>
                {ovr}
              </div>
              <div style={{
                fontSize:'10px', fontWeight:700, letterSpacing:'0.18em',
                color:'rgba(255,255,255,0.45)', textTransform:'uppercase', marginTop:'4px',
              }}>
                Overall
              </div>
            </div>
          </div>

          {/* Avatar — flutuante */}
          <div style={{ display:'flex', justifyContent:'center', marginTop:'-34px', position:'relative', zIndex:2 }}>
            <div style={{
              width:'68px', height:'68px', borderRadius:'50%',
              background:'linear-gradient(135deg,#15803d,#4ade80)',
              border:'3px solid #0b1610',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'20px', fontWeight:900, color:'white',
              boxShadow:'0 8px 28px rgba(34,197,94,0.45)',
            }}>
              {initials}
            </div>
          </div>

          {/* ── BAIXO ── */}
          <div style={{ padding:'12px 20px 22px', textAlign:'center' }}>
            <p style={{ margin:'0 0 2px', fontSize:'17px', fontWeight:800, color:'white' }}>{nome}</p>
            <p style={{ margin:'0 0 18px', fontSize:'12px', color:'rgba(255,255,255,0.38)' }}>
              {posicao}{cidade ? ` · ${cidade}` : ''}
            </p>

            {/* Separador */}
            <div style={{ height:'1px', background:'rgba(255,255,255,0.06)', marginBottom:'16px' }} />

            {/* Frase emocional */}
            <p style={{ margin:0, fontSize:'12px', color:'rgba(255,255,255,0.4)', lineHeight:1.6, fontStyle:'italic' }}>
              "Todo craque teve um começo.<br />O seu é hoje."
            </p>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="actions" style={{ width:'100%', maxWidth:'320px', display:'flex', flexDirection:'column', gap:'10px' }}>
        <button
          className="share-btn"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: `${nome} · ${ovr} OVR · MeuCraque`,
                text: `Acabei de entrar no MeuCraque! Meu Overall é ${ovr}. Você é o próximo?`,
                url: cardUrl,
              })
            } else {
              navigator.clipboard.writeText(cardUrl)
              alert('Link copiado! Cole no seu story ou grupo.')
            }
          }}
        >
          📲 Compartilhar meu card
        </button>

        <Link href="/atleta/perfil" style={{ textDecoration:'none' }}>
          <button className="ghost-btn">Ver meu perfil completo →</button>
        </Link>
      </div>

      <p style={{ marginTop:'20px', fontSize:'11px', color:'rgba(255,255,255,0.18)', textAlign:'center' }}>
        ⚽ MEU <span style={{ color:'#22c55e' }}>CRAQUE</span> · Você é o próximo.
      </p>
    </main>
  )
}

export default function BemVindoPage() {
  return (
    <Suspense fallback={
      <main style={{ background:'#06100a', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <p style={{ color:'rgba(255,255,255,0.3)', fontFamily:'system-ui' }}>Carregando…</p>
      </main>
    }>
      <BemVindoContent />
    </Suspense>
  )
}
