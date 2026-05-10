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

function BemVindoContent() {
  const params    = useSearchParams()
  const nome      = params.get('nome')      ?? 'Atleta'
  const posicao   = params.get('posicao')   ?? ''
  const cidade    = params.get('cidade')    ?? ''
  const dataNasc  = params.get('dataNasc')  ?? ''
  const uid       = params.get('uid')       ?? ''
  const athleteId = params.get('athleteId') ?? ''
  const avatarUrl = params.get('avatarUrl') ?? ''

  const categoria = dataNasc ? calcularCategoria(dataNasc) : ''
  const initials  = getInitials(nome)
  const posAbrev  = posLabel(posicao)
  const cardUrl   = uid ? `https://meucraque.com.br/jogador/${uid}` : 'https://meucraque.com.br'
  const primeiroNome = nome.split(' ')[0]
  const sobrenome = nome.split(' ').slice(1).join(' ')

  return (
    <main style={{
      background: '#06100a', minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'system-ui, sans-serif',
    }}>
      <style>{`
        @keyframes cardReveal {
          from { opacity:0; transform:translateY(40px) scale(0.94) rotateY(-8deg) }
          to   { opacity:1; transform:translateY(0) scale(1) rotateY(0deg) }
        }
        @keyframes idPop {
          0%   { opacity:0; transform:translateY(12px) }
          100% { opacity:1; transform:translateY(0) }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(10px) }
          to   { opacity:1; transform:translateY(0) }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center }
          100% { background-position: 200% center }
        }

        .card-wrap  { animation: cardReveal 0.7s cubic-bezier(.22,.68,0,1.15) forwards; perspective: 1000px; }
        .id-block   { animation: idPop 0.5s ease forwards 0.6s; opacity:0; }
        .name-row   { animation: fadeUp 0.4s ease forwards 0.1s; opacity:0; }
        .actions    { animation: fadeUp 0.4s ease forwards 0.75s; opacity:0; }

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

      {/* Headline */}
      <div className="name-row" style={{ textAlign:'center', marginBottom:'28px' }}>
        <p style={{ margin:'0 0 6px', fontSize:'12px', fontWeight:700, letterSpacing:'0.12em', color:'#22c55e', textTransform:'uppercase' }}>
          ⚡ perfil criado
        </p>
        <h1 style={{ margin:0, fontSize:'26px', fontWeight:900, color:'white', letterSpacing:'-0.02em', lineHeight:1.2 }}>
          Hoje você entrou no jogo,<br />
          <em style={{ color:'#22c55e', fontStyle:'normal' }}>{primeiroNome}.</em>
        </h1>
      </div>

      {/* ── CARD FIFA ── */}
      <div className="card-wrap" style={{ marginBottom:'20px' }}>
        <div style={{
          width: '220px',
          borderRadius: '18px',
          overflow: 'hidden',
          background: 'linear-gradient(160deg, #1a2e20 0%, #0d1f13 60%, #091510 100%)',
          border: '1px solid rgba(34,197,94,0.3)',
          boxShadow: '0 0 60px rgba(34,197,94,0.2), 0 30px 80px rgba(0,0,0,0.8)',
          position: 'relative',
        }}>

          {/* Brilho no topo */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(0,255,136,0.6), transparent)',
          }} />

          {/* Foto / Avatar area */}
          <div style={{
            position: 'relative',
            height: '220px',
            background: avatarUrl
              ? 'transparent'
              : 'linear-gradient(180deg, #1e3d28 0%, #0f2518 100%)',
            overflow: 'hidden',
          }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={nome}
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover', objectPosition: 'center top',
                  display: 'block',
                }}
              />
            ) : (
              /* Sem foto: silhueta */
              <div style={{
                width: '100%', height: '100%',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
                <div style={{
                  width: '72px', height: '72px', borderRadius: '50%',
                  background: 'linear-gradient(135deg,#15803d,#4ade80)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px', fontWeight: 900, color: 'white',
                  boxShadow: '0 8px 32px rgba(34,197,94,0.5)',
                }}>
                  {initials}
                </div>
              </div>
            )}

            {/* Overlay gradiente na foto */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px',
              background: 'linear-gradient(to top, rgba(9,21,16,1) 0%, transparent 100%)',
            }} />

            {/* Badge posição — top left */}
            <div style={{
              position: 'absolute', top: '10px', left: '10px',
              background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px', padding: '4px 8px',
              fontSize: '10px', fontWeight: 800, color: 'white', letterSpacing: '0.06em',
            }}>
              {posAbrev}
            </div>

            {/* Badge categoria — top right */}
            {categoria && (
              <div style={{
                position: 'absolute', top: '10px', right: '10px',
                background: 'rgba(34,197,94,0.2)', backdropFilter: 'blur(6px)',
                border: '1px solid rgba(34,197,94,0.4)',
                borderRadius: '8px', padding: '4px 8px',
                fontSize: '10px', fontWeight: 800, color: '#4ade80', letterSpacing: '0.06em',
              }}>
                {categoria}
              </div>
            )}
          </div>

          {/* Info bottom */}
          <div style={{ padding: '14px 16px 18px', textAlign: 'center' }}>
            <p style={{
              margin: '0 0 1px', fontSize: '18px', fontWeight: 900,
              color: 'white', letterSpacing: '-0.01em', lineHeight: 1.1,
            }}>
              {primeiroNome}
            </p>
            {sobrenome && (
              <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {sobrenome}
              </p>
            )}
            <p style={{ margin: '0 0 12px', fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
              {posicao}{cidade ? ` · ${cidade}` : ''}
            </p>

            {/* Separador */}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', marginBottom: '12px' }} />

            {/* Rating row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Rating
              </span>
              <span style={{ fontSize: '22px', fontWeight: 900, color: '#22c55e', letterSpacing: '-0.02em' }}>
                —
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.04em' }}>
              aguardando avaliação
            </p>
          </div>
        </div>
      </div>

      {/* ID do atleta */}
      {athleteId && (
        <div className="id-block" style={{ width:'100%', maxWidth:'280px', marginBottom:'20px' }}>
          <div style={{
            borderRadius:'14px', padding:'14px 18px',
            background:'rgba(0,255,136,0.06)',
            border:'1.5px solid rgba(0,255,136,0.3)',
            display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            <div>
              <p style={{ margin:'0 0 2px', fontSize:'10px', fontWeight:700, letterSpacing:'0.12em', color:'rgba(0,255,136,0.7)', textTransform:'uppercase' }}>
                Seu ID
              </p>
              <p style={{ margin:0, fontSize:'28px', fontWeight:900, color:'#00FF88', letterSpacing:'0.08em', lineHeight:1 }}>
                {athleteId}
              </p>
            </div>
            <div style={{ textAlign:'right' }}>
              <p style={{ margin:0, fontSize:'10px', color:'rgba(255,200,0,0.8)', fontWeight:700 }}>⚠️ Guarde</p>
              <p style={{ margin:0, fontSize:'10px', color:'rgba(255,255,255,0.3)' }}>usado no login</p>
            </div>
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="actions" style={{ width:'100%', maxWidth:'280px', display:'flex', flexDirection:'column', gap:'10px' }}>
        <button
          className="share-btn"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: `${nome} · MeuCraque`,
                text: `Acabei de criar meu perfil no MeuCraque! Meu ID é ${athleteId}. Você é o próximo?`,
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
